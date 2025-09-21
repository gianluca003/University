#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <sys/select.h>
#include <semaphore.h>
#include <errno.h>
#include <gmp.h>
#include "../header/client_chord.h"
#include "../header/chord.h"
#include "../header/chord_struct.h"

#define MAX_LISTEN_CONNECTIONS 160

#define RED   "\x1b[31m"
#define YELLOW   "\033[1;33m"
#define GREEN "\x1b[32m"
#define RESET "\x1b[0m"

void* server(void* args);
static void server_die(int scoket, char* error, server_args* t_args);

void* server(void* args) {

    server_args* t_args = (server_args*) args;
    int socket_listen, new_client;
    struct sockaddr_in listen_address,client_address, new_client_address;
    fd_set readset,tempset;
    int select_result;
    int maxfd,length;
    char ip_str[BUFSIZ];
    char buffer[1024];
    char command[4];
    mpz_t id;
    char str_id[45], str_id2[45];
    node return_node, set_node;
    int pos_finger_table;
    uint16_t is_set_node;
    char args_str_send[BUFSIZ];
    ssize_t bytes_read, bytes_sent;
    char server_ready = 0;
    node old_predecessor, old_successor; //using in set predecessor and set successor

    //Server wait that die function finish to initialize itself
    sem_wait(t_args->die_ready);

    //The listen socket handles connection requests and data from clients
    socket_listen = socket(AF_INET,SOCK_STREAM,0);

    if(socket_listen<1)
        server_die(socket_listen,"[!] SERVER ERROR: Problem occurred while creating server socket\n\0",t_args);

    listen_address.sin_family = AF_INET;
    listen_address.sin_addr.s_addr = inet_addr(t_args->current_node.ip);
    listen_address.sin_port = htons(t_args->current_node.port);

    if (bind(socket_listen, (struct sockaddr*)&listen_address, sizeof(listen_address)) < 0)
        server_die(socket_listen,"[!] SERVER ERROR: Problem occurred while binding socket\n\0",t_args);


    if(listen(socket_listen,MAX_LISTEN_CONNECTIONS)<0)
        server_die(socket_listen,"[!] SERVER ERROR: Problem occurred during listen 'listen socket'\n\0",t_args);


    if(t_args->verbose_level)
        printf("[~] SERVER: Socket listen on %s:%d\n",t_args->current_node.ip,t_args->current_node.port);

    //Initialize readfds and timeout for select
    FD_ZERO(&readset);
    FD_SET(socket_listen, &readset);
    maxfd = socket_listen;

    //End server initialization. stabilize, fix_finger and update_successors_list threads can start and main can continue
    sem_post(t_args->server_ready);
    sem_post(t_args->server_ready);
    sem_post(t_args->server_ready);
    sem_post(t_args->server_ready);

    do {
        memcpy(&tempset, &readset, sizeof(readset));

        //select() is used in a blocking way to wait for incoming connections or data from clients
        select_result = select(maxfd + 1, &tempset, NULL, NULL, NULL);

        if (select_result <= 0 && errno != EINTR){
            printf(RED"[!] SERVER ERROR:  Problem occurred in select. %s\n"RESET, strerror(errno));
        }
        else if(select_result>0){

            if(FD_ISSET(socket_listen, &tempset)) {

                length = sizeof(new_client_address);
                new_client = accept(socket_listen, (struct sockaddr *)&new_client_address, &length);

                if (new_client < 0) {
                    printf(RED"[!] SERVER ERROR:  Problem occurred while accepting a new client connection. %s\n"RESET,
                           strerror(errno));
                } else {
                    //Adds the new_client socket to the set monitored by select() for activity
                    FD_SET(new_client, &readset);
                    maxfd = (maxfd < new_client) ? new_client : maxfd;

                    if(t_args->verbose_level>1){
                        inet_ntop(AF_INET, &(new_client_address.sin_addr), ip_str, sizeof(ip_str));
                        printf("[~] SERVER: Client %s:%d connected (socket %d)\n",ip_str,ntohs(new_client_address.sin_port),new_client);
                    }
                }
                //remove the listening socket from set of file descriptors monitored by select, preventing it from being processed again
                FD_CLR(socket_listen, &tempset);
            }

            //Read data from clients (that have already established a connection)
            for (int fd = 0; fd <= maxfd; fd++) {
                if (FD_ISSET(fd, &tempset)) {
                         bytes_read = recv(fd, buffer, sizeof(buffer)-1, 0);

                        if (bytes_read < 0) {
                            // Error during receiving message from client
                            if (errno != EINTR && errno != EAGAIN) {

                                fprintf(stderr, YELLOW"[!] SERVER ERROR: receiving failed (retry) \n"RESET);

                                close(fd);
                                FD_CLR(fd, &readset);
                            }
                        } else if (bytes_read == 0) {
                            // Client close connection
                            if (t_args->verbose_level > 1)
                                printf("[~] SERVER: Client socket %d disconnected\n", fd);

                            close(fd);
                            FD_CLR(fd, &readset);
                        } else {
                            // Correct data
                            buffer[bytes_read] = '\0'; // null terminate string

                            if (t_args->verbose_level > 1)
                                printf("[~] SERVER: Received from socket %d: '%s'\n", fd, buffer);

                            sscanf(buffer, "%s", command);

                        //Execute closeset_preceding_finger()
                            if(strcmp(command,"CPF") == 0){
                                mpz_init(id);
                                sscanf(buffer,"%s %s",command,str_id);
                                mpz_set_str(id, str_id, 16);

                                if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Execute closest_preceding_finger() for socket %d\n", fd);

                                node_copy(&return_node, closest_preceding_finger(id,
                                                                         t_args->current_node,
                                                                         *t_args->current_node_info,
                                                                         t_args->finger_lock));


                                // Serialize all structure fields into a single string with clear separators for transmission over the network
                                memset(args_str_send, 0, sizeof(args_str_send));
                                mpz_get_str(str_id, 16, return_node.id);

                                snprintf(args_str_send, sizeof(args_str_send),"%s %s %d %s",
                                         str_id,
                                         return_node.ip,
                                         return_node.port,
                                         return_node.host_domain);

                                bytes_sent = send(fd, args_str_send, sizeof(args_str_send), 0);

                                if(bytes_sent <= 0)
                                    fprintf(stderr, RED"[!] SERVER ERROR: send failed\n"RESET);
                                else if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Sent response to client on socket %d: %s\n", fd, args_str_send);
                            }
                        //Execute find_successor()
                            else if(strcmp(command,"FS") == 0){
                                mpz_init(id);
                                sscanf(buffer,"%s %s",command,str_id);
                                mpz_set_str(id, str_id, 16);

                                if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Execute find_successor() for socket %d\n", fd);

                                node_copy(&return_node, find_successor(id,
                                                                                 t_args->current_node,
                                                                                 *t_args->current_node_info,
                                                                                 t_args->finger_lock,
                                                                                 t_args->verbose_level));

                                mpz_get_str(str_id, 16, return_node.id);

                                snprintf(args_str_send, sizeof(args_str_send),"%s %s %d %s",
                                         str_id,
                                         return_node.ip,
                                         return_node.port,
                                         return_node.host_domain);

                                bytes_sent = send(fd, args_str_send, sizeof(args_str_send), 0);
                                if(bytes_sent < 0)
                                    fprintf(stderr, RED"[!] SERVER ERROR: send failed\n"RESET);
                                else if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Sent response to client on socket %d: %s\n", fd, args_str_send);
                            }
                        //Send predecessor and successor of current node
                            else if(strcmp(command,"GI") == 0){

                                pthread_mutex_lock(t_args->finger_lock);

                                mpz_get_str(str_id, 16, t_args->current_node_info->successor.id);
                                mpz_get_str(str_id2, 16, t_args->current_node_info->predecessor.id);

                                if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Get current node info for socket %d\n", fd);

                                snprintf(args_str_send, sizeof(args_str_send),"%s %s %d %s %s %s %d %s",
                                         str_id,
                                         t_args->current_node_info->successor.ip,
                                         t_args->current_node_info->successor.port,
                                         t_args->current_node_info->successor.host_domain,
                                         str_id2,
                                         t_args->current_node_info->predecessor.ip,
                                         t_args->current_node_info->predecessor.port,
                                         t_args->current_node_info->predecessor.host_domain
                                );
                                pthread_mutex_unlock(t_args->finger_lock);

                                bytes_sent = send(fd, args_str_send, sizeof(args_str_send), 0);
                                if(bytes_sent < 0)
                                    fprintf(stderr, RED"[!] SERVER ERROR: send failed\n"RESET);
                                else if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Sent response to client on socket %d: %s\n", fd, args_str_send);
                            }
                        //Set new predecessor of current node
                            else if(strcmp(command,"SP") == 0){

                                mpz_init(return_node.id);

                                is_set_node = htons(-1);

                                sscanf(buffer,"%s %s %s %d %s",command,str_id,return_node.ip, &return_node.port, return_node.host_domain);
                                mpz_set_str(return_node.id, str_id, 16);

                                if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Set new predecessor '%s' (request from socket %d)\n",str_id, fd);

                                pthread_mutex_lock(t_args->finger_lock);
                                node_copy(&old_predecessor,t_args->current_node_info->predecessor);

                                if(node_copy(&t_args->current_node_info->predecessor, return_node)<0){

                                    //Restore old predecessor
                                    node_copy(&t_args->current_node_info->predecessor, old_predecessor);
                                    pthread_mutex_unlock(t_args->finger_lock);

                                    //Copy failed, send 0 to client
                                         if(t_args->verbose_level > 1)
                                             fprintf(stderr, RED"[!] ERROR:  copy new predecessor failed\n"RESET);

                                        bytes_sent = send(fd,&is_set_node, sizeof(is_set_node), 0);
                                        if(bytes_sent < 0)
                                            fprintf(stderr, RED"[!] SERVER ERROR: send failed\n"RESET);
                                        else if(t_args->verbose_level > 1)
                                            printf("[~] SERVER: Sent response (failed set predecessor) to client on socket %d: '-1'\n", fd);
                                } else{
                                    pthread_mutex_unlock(t_args->finger_lock);

                                    is_set_node = htons(1);
                                    //Copy ok, send 1 to client
                                    bytes_sent = send(fd,&is_set_node, sizeof(is_set_node), 0);
                                    if(bytes_sent < 0)
                                        fprintf(stderr, RED"[!] SERVER ERROR: send failed\n"RESET);
                                    else if(t_args->verbose_level > 1)
                                        printf("[~] SERVER: Sent response (success set predecessor) to client on socket %d: '1'\n", fd);
                                }

                            }
                                //Set new successor of current node
                            else if(strcmp(command,"SS") == 0){

                                mpz_init(return_node.id);

                                is_set_node = htons(-1);

                                sscanf(buffer,"%s %s %s %d %s",command,str_id,return_node.ip, &return_node.port, return_node.host_domain);
                                mpz_set_str(return_node.id, str_id, 16);

                                if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Set new successor '%s' (request from socket %d)\n",str_id, fd);

                                pthread_mutex_lock(t_args->finger_lock);
                                node_copy(&old_successor,t_args->current_node_info->successor);

                                if(node_copy(&t_args->current_node_info->successor, return_node)<0){

                                    //Restore old predecessor
                                    node_copy(&t_args->current_node_info->successor, old_successor);
                                    pthread_mutex_unlock(t_args->finger_lock);

                                    //Copy failed, send 0 to client
                                    if(t_args->verbose_level > 1)
                                        fprintf(stderr, RED"[!] ERROR:  copy new successor failed\n"RESET);

                                    bytes_sent = send(fd,&is_set_node, sizeof(is_set_node), 0);
                                    if(bytes_sent < 0)
                                        fprintf(stderr, RED"[!] SERVER ERROR: send failed\n"RESET);
                                    else if(t_args->verbose_level > 1)
                                        printf("[~] SERVER: Sent response (failed set successor) to client on socket %d: '-1'\n", fd);
                                } else{
                                    pthread_mutex_unlock(t_args->finger_lock);

                                    is_set_node = htons(1);
                                    //Copy ok, send 1 to client
                                    bytes_sent = send(fd,&is_set_node, sizeof(is_set_node), 0);
                                    if(bytes_sent < 0)
                                        fprintf(stderr, RED"[!] SERVER ERROR: send failed\n"RESET);
                                    else if(t_args->verbose_level > 1)
                                        printf("[~] SERVER: Sent response (success set successor) to client on socket %d: '1'\n", fd);
                                }

                            }
                        //Update current finger table
                            else if(strcmp(command,"UT") == 0){
                                memset(&set_node, 0, sizeof(set_node));
                                sscanf(buffer,"%s %s %s %d %s %d",command,str_id,set_node.ip, &set_node.port, set_node.host_domain, &pos_finger_table);
                                mpz_set_str(set_node.id, str_id, 16);

                                if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Execute update_finger_table() (request from socket %d)\n", fd);

                                update_finger_table(t_args->current_node,
                                                    t_args->current_node_info,
                                                    set_node,
                                                    pos_finger_table,
                                                    t_args->finger_lock,
                                                    t_args->verbose_level);
                            }
                        //A node informs current node that it may be its predecessor; the node updates if it’s closer or none is set.
                            else if(strcmp(command,"NS") == 0){
                                memset(&set_node, 0, sizeof(set_node));
                                sscanf(buffer,"%s %s %s %d %s",command,str_id,set_node.ip, &set_node.port, set_node.host_domain);
                                mpz_set_str(set_node.id, str_id, 16);

                                if(t_args->verbose_level > 1)
                                    printf("[~] SERVER: Execute notify() (request from socket %d)\n", fd);

                                notify(t_args->current_node,
                                       t_args->current_node_info,
                                       t_args->finger_lock,
                                       set_node);
                            } else
                                fprintf(stderr, RED"[!] SERVER ERROR: Invalid command received from client'\n"RESET);
                        }
                }

            }

        }

    }while(1);

    server_die(socket_listen,NULL,t_args);
}

static void server_die(int scoket, char* error, server_args* t_args){

    if(error!=NULL)
        fprintf(stderr, RED "%s" RESET,error);

    if(scoket>0)
        close(scoket);

    //Call die() (chord.c) function to terminate process
    pthread_mutex_lock(t_args->die_lock);
    pthread_cond_signal(t_args->die_sleep);
    pthread_mutex_unlock(t_args->die_lock);

    pthread_exit(NULL);
}



