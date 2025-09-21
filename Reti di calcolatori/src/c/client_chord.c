#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <sys/socket.h>  //Definition of functions and data structures for socket creation
#include <netinet/in.h>  //Definition of data structures for manage ip addresses
#include <arpa/inet.h>
#include <unistd.h>
#include <semaphore.h>
#include <string.h>
#include <gmp.h>
#include "../header/chord_struct.h"
#include "../header/chord.h"

#define RED    "\x1b[31m"
#define GREEN  "\x1b[32m"
#define RESET  "\x1b[0m"

typedef struct sockaddr_in sockaddr_in;

int client_get_remote_node(node remote_node,mpz_t find_id, node* output_node,char* command, short verbose_level);
int client_get_remote_node_info(node remote_node, node_info* output_node, short verbose_level);
int client_set_remote_node(node remote_node, node send_node,char* command, short verbose_level);
int client_update_remote_table(node remote_node,node new_successor, short pos_table, short verbose_level);
int client_notify_successor_node(node remote_node, node current_node, short verbose_level);


//get the closest_preceding_finger from a remote node
//command identify which functions the remote server must execute.
//'CPF'= closest_preceding_finger()
//'FS'= find_successor()
int client_get_remote_node(node remote_node,mpz_t find_id, node* output_node,char* command, short verbose_level){

    int client_socket;                            //Socket descriptor
    char node_id[45];
    char args_str_send[512];
    char str_recv_node[BUFSIZ];
    node recv_node;
    int byte_sent,byte_recvd;
    sockaddr_in server_address;

    client_socket = socket(AF_INET, SOCK_STREAM, 0);

    if(!*command){
        fprintf(stderr, RED "[!] CLIENT ERROR: Invalid command to send to remote server\n" RESET);
        return -1;
    }

    if (client_socket < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while creating socket client\n" RESET);
        return -1;
    }

    if(!*remote_node.ip || (remote_node.port<=0 || remote_node.port>65535)){
        fprintf(stderr, RED "[!] CLIENT ERROR ('%s'): Invalid address of remote server (%s:%d)\n" RESET,command,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = inet_addr(remote_node.ip);
    server_address.sin_port = htons(remote_node.port);

    if (connect(client_socket, (struct sockaddr *)&server_address, sizeof(server_address)) < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR ('%s'): connection failed (remote node %s:%d)\n" RESET,command,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    memset(args_str_send, 0, sizeof(args_str_send));
    mpz_get_str(node_id, 16, find_id);

    // Serialize all structure fields into a single string with clear separators for transmission over the network
    snprintf(args_str_send, sizeof(args_str_send), "%s %s",command,node_id);

    if(verbose_level>1)
        printf( "[~] CLIENT: connect to %s:%d. Send: '%s'\n",remote_node.ip,remote_node.port, args_str_send);

    byte_sent = write(client_socket, args_str_send, sizeof(args_str_send));

    if (byte_sent <= 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while sending a message\n" RESET);
        close(client_socket);
        return -1;
    }

    if(verbose_level>1)
        gmp_printf("[~] CLIENT: '%s' to find node '%040Zx' sent to %s:%d\n",command,find_id,remote_node.ip,remote_node.port);

    byte_recvd = read(client_socket, &str_recv_node, BUFSIZ);

    if (byte_recvd <= 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while receive a message\n" RESET);
        close(client_socket);
        return -1;
    }

    sscanf(str_recv_node,"%s %s %d %s",  node_id,
                                                       recv_node.ip,
                                                       &recv_node.port,
                                                       recv_node.host_domain);

    mpz_init(recv_node.id);
    mpz_set_str(recv_node.id, node_id, 16);

    node_copy(output_node,recv_node);

    if(verbose_level>1)
        gmp_printf("[~] CLIENT: received node '%040Zx' from %s:%d\n",recv_node.id,remote_node.ip,remote_node.port);

    close(client_socket);
    return 0;
}

//'GI' = get info of a node
int client_get_remote_node_info(node remote_node, node_info* output_node, short verbose_level){
    int client_socket;                            //Socket descriptor
    node recv_node_successor, recv_node_predecessor;
    char id_successor[45],id_predecessor[45];
    char command[3] = "GI\0";
    char str_node_info[BUFSIZ];
    int byte_sent,byte_recvd;
    sockaddr_in server_address;

    client_socket = socket(AF_INET, SOCK_STREAM, 0);

    if (client_socket < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while creating socket client\n" RESET);
        return -1;
    }

    if(!*remote_node.ip || (remote_node.port<=0 || remote_node.port>65535)){
        fprintf(stderr, RED "[!] CLIENT ERROR ('%s'): Invalid address of remote server (%s:%d)\n" RESET,command,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = inet_addr(remote_node.ip);
    server_address.sin_port = htons(remote_node.port);

    if(verbose_level>2)
        printf( "[~] CLIENT: connect to %s:%d\n",remote_node.ip,remote_node.port);

    if (connect(client_socket, (struct sockaddr *)&server_address, sizeof(server_address)) < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR ('GI'): connection failed (remote node %s:%d)\n" RESET,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    byte_sent = write(client_socket, command, sizeof(command));

    if (byte_sent <= 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while sending a message\n" RESET);
        close(client_socket);
        return -1;
    }

    if(verbose_level>2)
        printf("[~] CLIENT: '%s' to find node info sent to %s:%d\n",command,remote_node.ip,remote_node.port);

    byte_recvd = read(client_socket, &str_node_info, BUFSIZ);

    if (byte_recvd <= 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while receive a message\n" RESET);
        close(client_socket);
        return -1;
    }

    sscanf(str_node_info,"%s %s %d %s %s %s %d %s",id_successor,
                                                              recv_node_successor.ip,
                                                              &recv_node_successor.port,
                                                              recv_node_successor.host_domain,
                                                              id_predecessor,
                                                              recv_node_predecessor.ip,
                                                              &recv_node_predecessor.port,
                                                              recv_node_predecessor.host_domain);

    mpz_init(recv_node_successor.id);
    mpz_init(recv_node_predecessor.id);

    mpz_set_str(recv_node_successor.id, id_successor, 16);
    mpz_set_str(recv_node_predecessor.id, id_predecessor, 16);

    output_node->finger_table=NULL;
    node_copy(&output_node->successor,recv_node_successor);
    node_copy(&output_node->predecessor,recv_node_predecessor);

    if(verbose_level>2)
        printf("[~] CLIENT: received node info '%s' from %s:%d\n",str_node_info,remote_node.ip,remote_node.port);


    close(client_socket);
    return 0;
}

//'SP' = set remote predecessor
//'SS' = set remote successor => Not provided in the official documentation
int client_set_remote_node(node remote_node, node send_node,char* command, short verbose_level){
    int client_socket;                            //Socket descriptor
    char args_str_send[512];
    char node_id[45];
    uint16_t return_code;
    int byte_sent,byte_recvd;
    sockaddr_in server_address;

    client_socket = socket(AF_INET, SOCK_STREAM, 0);

    if (client_socket < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while creating socket client\n" RESET);
        return -1;
    }

    if(!*remote_node.ip || (remote_node.port<=0 || remote_node.port>65535)){
        fprintf(stderr, RED "[!] CLIENT ERROR ('%s'): Invalid address of remote server (%s:%d)\n" RESET,command,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = inet_addr(remote_node.ip);
    server_address.sin_port = htons(remote_node.port);

    if(verbose_level>1)
        printf( "[~] CLIENT: connect to %s:%d\n",remote_node.ip,remote_node.port);

    if (connect(client_socket, (struct sockaddr *)&server_address, sizeof(server_address)) < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR ('%s'): connection failed (remote node %s:%d)\n" RESET,command,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    memset(args_str_send, 0, sizeof(args_str_send));
    mpz_get_str(node_id, 16, send_node.id);

    snprintf(args_str_send, sizeof(args_str_send), "%s %s %s %d %s",
             command,
             node_id,
             send_node.ip,
             send_node.port,
             send_node.host_domain);

    byte_sent = write(client_socket, args_str_send, sizeof(args_str_send));

    if (byte_sent <= 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while sending a message\n" RESET);
        close(client_socket);
        return -1;
    }

    if(verbose_level>1){
        if(strcmp(command,"SP\0")==0)
            printf("[~] CLIENT: 'SP' to set predecessor of %s:%d\n",remote_node.ip,remote_node.port);
        else if(strcmp(command,"SS\0")==0)
            printf("[~] CLIENT: 'SS' to set successor of %s:%d\n",remote_node.ip,remote_node.port);
    }

    byte_recvd = read(client_socket, &return_code, sizeof(return_code));

    return_code = ntohs(return_code);
    if (byte_recvd <= 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while receive a message\n" RESET);
        close(client_socket);
        return -1;
    }

    if(return_code<0){
        fprintf(stderr, RED "[!] CLIENT ERROR: The server did not store the predecessor\n" RESET);
        close(client_socket);
        return -1;
    }

    if(verbose_level>1){
        if(strcmp(command,"SP\0") == 0)
            printf("[~] CLIENT: Successful memorization of the predecessor in %s:%d\n",remote_node.ip,remote_node.port);
        else if(strcmp(command,"SS\0") == 0)
            printf("[~] CLIENT: Successful memorization of the successor in %s:%d\n",remote_node.ip,remote_node.port);
    }

    close(client_socket);
    return 0;
}

//'UT' = update remote finger table with new node (new successor) update_finger_table()
int client_update_remote_table(node remote_node,node new_successor, short pos_table, short verbose_level){
    int client_socket;                            //Socket descriptor
    char args_str_send[512];
    char node_id[45];
    int byte_sent;
    sockaddr_in server_address;

    client_socket = socket(AF_INET, SOCK_STREAM, 0);

    if (client_socket < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while creating socket client\n" RESET);
        return -1;
    }

    if(!*remote_node.ip || (remote_node.port<=0 || remote_node.port>65535)){
        fprintf(stderr, RED "[!] CLIENT ERROR ('UT'): Invalid address of remote server (%s:%d)\n" RESET,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = inet_addr(remote_node.ip);
    server_address.sin_port = htons(remote_node.port);

    if(verbose_level>1)
        printf( "[~] CLIENT: connect to %s:%d\n",remote_node.ip,remote_node.port);

    if (connect(client_socket, (struct sockaddr *)&server_address, sizeof(server_address)) < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR ('UT'): connection failed (remote node %s:%d)\n" RESET,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    memset(args_str_send, 0, sizeof(args_str_send));
    mpz_get_str(node_id, 16, new_successor.id);

    snprintf(args_str_send, sizeof(args_str_send), "%s %s %s %d %s %d",
             "UT",
             node_id,
             new_successor.ip,
             new_successor.port,
             new_successor.host_domain,
             pos_table);

    byte_sent = write(client_socket, args_str_send, sizeof(args_str_send));

    if (byte_sent <= 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while sending a message\n" RESET);
        close(client_socket);
        return -1;
    }

    if(verbose_level>1)
        printf("[~] CLIENT: 'UT' to verify and set successor of %s:%d\n",remote_node.ip,remote_node.port);


    close(client_socket);
    return 0;
}

//'NS' = notify successor notify()
int client_notify_successor_node(node remote_node, node current_node, short verbose_level){
    int client_socket;                            //Socket descriptor
    char args_str_send[512];
    char node_id[45];
    char recvd_msg[BUFSIZ];
    int byte_sent,byte_recvd;
    sockaddr_in server_address;

    client_socket = socket(AF_INET, SOCK_STREAM, 0);

    if (client_socket < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while creating socket client\n" RESET);
        return -1;
    }

    if(!*remote_node.ip || (remote_node.port<=0 || remote_node.port>65535)){
        fprintf(stderr, RED "[!] CLIENT ERROR (NS): Invalid address of remote server (%s:%d)\n" RESET,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = inet_addr(remote_node.ip);
    server_address.sin_port = htons(remote_node.port);

    if(verbose_level>2)
        printf( "[~] CLIENT: connect to %s:%d\n",remote_node.ip,remote_node.port);

    if (connect(client_socket, (struct sockaddr *)&server_address, sizeof(server_address)) < 0){
        fprintf(stderr, RED "[!] CLIENT ERROR ('NS'): connection failed (remote node %s:%d)\n" RESET,remote_node.ip,remote_node.port);
        close(client_socket);
        return -1;
    }

    memset(args_str_send, 0, sizeof(args_str_send));
    mpz_get_str(node_id, 16, current_node.id);

    snprintf(args_str_send, sizeof(args_str_send), "%s %s %s %d %s",
             "NS",
             node_id,
             current_node.ip,
             current_node.port,
             current_node.host_domain);


    byte_sent = write(client_socket, args_str_send, sizeof(args_str_send));

    if (byte_sent <= 0){
        fprintf(stderr, RED "[!] CLIENT ERROR: Problem occurred while sending a message\n" RESET);
        close(client_socket);
        return -1;
    }

    if(verbose_level>2)
        printf("[~] CLIENT: 'NS' to notify predecessor's successor of %s:%d\n",remote_node.ip,remote_node.port);

    close(client_socket);
    return 0;
}





