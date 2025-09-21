#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <gmp.h>
#include <signal.h>
#include "../header/init_chord.h"
#include "../header/chord_struct.h"
#include "../header/chord.h"
#include "../header/client_chord.h"
#include "../header/server_chord.h"

#define RED   "\x1b[31m"
#define GREEN "\x1b[32m"
#define CYAN  "\x1b[36m"
#define RESET "\x1b[0m"

int node_copy(node* dest_node, const node src_node);
void print_node_info(node current_node, node_info current_info,pthread_mutex_t* finger_lock);
void print_node_table(node current_node, node_info current_info,pthread_mutex_t* finger_lock);
void* exit_signal(void* args);
void* die(void* args);

#include <stdio.h>
#include <gmp.h>

int main(int argc, char *argv[]){

    node current_node;
    node_info current_node_info;
    node bootstrap;
    node* backup_successors_list;
    short verbosity;                    //Verbose level
    int stop, refresh_time, list_length;  //Stop is a flag to exit from while loop in the main. Refresh time every entry in finger table
    pthread_t t_server,t_stabilize, t_fix, t_die, t_signal, t_successors;
    server_args ts_args;
    stabilize_args stab_args,fix_args;
    die_args td_args;
    signal_args tsig_args;
    successors_args succ_args;
    sigset_t set;
    sem_t server_ready, die_ready, backgrounds_ready;       //background threads are stabilize and fix_finger threads
    pthread_mutex_t finger_lock =PTHREAD_MUTEX_INITIALIZER;
    pthread_mutex_t list_lock =PTHREAD_MUTEX_INITIALIZER;   //Lock for array of successors backup shared between update_successors_list and stabilize threads
    pthread_mutex_t die_lock = PTHREAD_MUTEX_INITIALIZER;   //Data used by threads to cause the process to terminate
    pthread_cond_t die_sleep = PTHREAD_COND_INITIALIZER;
    mpz_t search_key;
    node find_node;
    char str_find_node[45], is_exit[10];

    memset(&current_node,0,sizeof(node));
    memset(&bootstrap,0,sizeof(node));
    verbosity=0;
    *current_node.ip='\0';
    *current_node.host_domain='\0';
    *bootstrap.ip='\0';
    mpz_init(search_key);

    backup_successors_list = (node*) calloc(160, sizeof(node)*160);

    if (backup_successors_list == NULL) {
        fprintf(stderr, RED"[!] ERROR: A problem occur during backup successors list initialization\n"RESET);
        fprintf(stderr, "[!] STOP\n");
        exit(EXIT_FAILURE);
    }
    list_length=0;

    if(get_option(argc,argv,&bootstrap,&current_node,&verbosity,&refresh_time) == -1){
        fprintf(stderr, "[!] STOP\n");
        exit(EXIT_FAILURE);
    }

    hash_sha1(&current_node,verbosity);

    gmp_printf(GREEN"[OK]"RESET" Node ID: %040Zx\n",current_node.id);

    sem_init(&die_ready,0,0); //Define threads order: first die, then server
    sem_init(&server_ready,0,0); //Define order between threads: first server then fix_fingers and stabilize threads
    sem_init(&backgrounds_ready,0,0); //Define order: first stabilize and fix_finger thread, then main can continue

    //Initialize server thread parameters
    ts_args.server_ready=&server_ready;
    ts_args.finger_lock=&finger_lock;
    ts_args.verbose_level=verbosity;
    node_copy(&ts_args.current_node,current_node);
    ts_args.current_node_info=&current_node_info;
    ts_args.die_ready=&die_ready;
    ts_args.die_lock=&die_lock;
    ts_args.die_sleep=&die_sleep;

    //Initialize stabilize thread parameter
    stab_args.server_ready=&server_ready;
    node_copy(&stab_args.current_node,current_node);
    stab_args.current_node_info=&current_node_info;
    stab_args.finger_lock=&finger_lock;
    stab_args.list_lock=&list_lock;
    stab_args.backgrounds_ready=&backgrounds_ready;
    stab_args.verbose_level=verbosity;
    stab_args.refresh_time=refresh_time;
    stab_args.successors_list=backup_successors_list;
    stab_args.list_length=&list_length;

    //Initialize fix_finger thread parameter
    fix_args.server_ready=&server_ready;
    node_copy(&fix_args.current_node,current_node);
    fix_args.current_node_info=&current_node_info;
    fix_args.finger_lock=&finger_lock;
    fix_args.backgrounds_ready=&backgrounds_ready;
    fix_args.verbose_level=verbosity;
    fix_args.refresh_time=refresh_time;

    //Initialize update_successors_list thread parameter
    node_copy(&succ_args.current_node,current_node);
    succ_args.server_ready=&server_ready;
    succ_args.backgrounds_ready=&backgrounds_ready;
    succ_args.finger_lock=&finger_lock;
    succ_args.list_lock=&list_lock;
    succ_args.successors_list=backup_successors_list;
    succ_args.list_length=&list_length;
    succ_args.current_node_info=&current_node_info;
    succ_args.verbose_level=verbosity;

    //Initialize die thread parameter
    td_args.server=&t_server;
    td_args.stabilize=&t_stabilize;
    td_args.fix=&t_fix;
    td_args.die_ready=&die_ready;
    td_args.die_lock=&die_lock;
    td_args.die_sleep=&die_sleep;

    //Initialize signal exit thread parameter
    tsig_args.set=&set;
    node_copy(&tsig_args.current_node,current_node);
    tsig_args.current_node_info=&current_node_info;
    tsig_args.verbose_level=verbosity;

    sigemptyset(&set);
    sigaddset(&set, SIGINT);
    sigaddset(&set, SIGTERM);

    //Block signal in the main thread. I block the signal before that threads starts
    if (pthread_sigmask(SIG_BLOCK, &set, NULL) != 0) {
        fprintf(stderr, RED "[!] ERROR: A problem occurred while blocking OS signal in the main thread\n" RESET);

        exit(EXIT_FAILURE);
    }

    pthread_create(&t_die,NULL,die,&td_args);
    pthread_create(&t_server,NULL,server,&ts_args);
    pthread_create(&t_signal,NULL,exit_signal,&tsig_args);

    sem_wait(&server_ready); //Wait the finish of server initialization

    //Initialize current node
    if (join(bootstrap,&current_node,&current_node_info,&finger_lock,verbosity) == -1) {
        fprintf(stderr, "[!] STOP\n");
        exit(EXIT_FAILURE);
    }

    pthread_create(&t_stabilize,NULL,stabilize,&stab_args);
    pthread_create(&t_fix,NULL,fix_fingers,&fix_args);
    pthread_create(&t_successors,NULL, update_successors_list,&succ_args);

    //Two wait because semaphore doesn't accept negative value (e.g. -1)
    sem_wait(&backgrounds_ready); //Wait stabilize initialization
    sem_wait(&backgrounds_ready); //Wait fix_finger initialization
   sem_wait(&backgrounds_ready); //Wait update_successors_list initialization

    printf(GREEN"[OK]"RESET" Current node is ready!\n");

    //Manage the request for searching a key
    stop=1;
   do{
        memset(&find_node,0,sizeof(find_node));

       printf(CYAN"[?]"RESET" Enter the key value you want to search for: ");
       scanf("%s",str_find_node);
       printf("\n");

            if(strcmp(str_find_node,"exit\0")==0) {
                stop=0;
            }
            else if(strcmp(str_find_node,"info\0")==0){
                print_node_info(current_node,current_node_info,&finger_lock);
            }
            else if(strcmp(str_find_node,"all\0")==0){
                print_node_info(current_node,current_node_info,&finger_lock);
                print_node_table(current_node,current_node_info,&finger_lock);
            }
            else{
                if (mpz_set_str(search_key, str_find_node, 16) != 0)
                    fprintf(stderr, RED "[!] ERROR: A problem occurred while coping digest value\n" RESET);
                else {
                    if (verbosity > 1)
                        printf("[~] CURRENT NODE: execute find_successor()\n");

                    find_node = find_successor(search_key, current_node, current_node_info, &finger_lock, verbosity);
                    if (mpz_cmp(find_node.id, current_node.id) == 0)
                        gmp_printf(GREEN"[OK]"RESET" Responsible node for ID %040Zx is local current node\n", search_key,
                                   find_node.id, find_node.ip, find_node.port);
                    else
                        gmp_printf(GREEN"[OK]"RESET" Responsible node for ID %040Zx is %040Zx (%s:%d)\n", search_key,
                                   find_node.id, find_node.ip, find_node.port);
                }
            }
        } while(stop);

   //Not provided in the official documentation: when process stop,
   //set the predecessor.successor = current_node.successor
   //and set the successor.predecessor = current_node.predecessor
    client_set_remote_node(current_node_info.predecessor,current_node_info.successor,"SS\0",verbosity);
    client_set_remote_node(current_node_info.successor,current_node_info.predecessor,"SP\0",verbosity);

    printf("[!] STOP\n");

    exit(EXIT_SUCCESS);
}

void print_node_table(node current_node, node_info current_info, pthread_mutex_t* finger_lock){

    pthread_mutex_lock(finger_lock);
    for(int i=0; i<160;i++){
        printf("    Entry number: %d\n",i);
        gmp_printf("    start: %040Zx\n",current_info.finger_table[i].start);
        gmp_printf("    end: %040Zx\n",current_info.finger_table[i].end);
        gmp_printf("    successor: %040Zx ",current_info.finger_table[i].successor.id);

        if(mpz_cmp(current_node.id,current_info.finger_table[i].successor.id)==0)
            printf("(local node)");
        printf("\n\n");
    }
    pthread_mutex_unlock(finger_lock);
}

void print_node_info(node current_node, node_info current_info,pthread_mutex_t* finger_lock){

    pthread_mutex_lock(finger_lock);

    gmp_printf("INFO: predecessor ID: %040Zx ",current_info.predecessor.id);
    if(mpz_cmp(current_node.id,current_info.predecessor.id)==0)
        printf("(local node)");

    gmp_printf(" successor ID: %040Zx ",current_info.successor.id);
    if(mpz_cmp(current_node.id,current_info.successor.id)==0)
        printf("(local node) ");

    printf("\n\n");
    pthread_mutex_unlock(finger_lock);
}

void* exit_signal(void* args){
    signal_args* t_args=(signal_args*) args;
    int sig;

    while (sigwait(t_args->set, &sig) != 0);

    client_set_remote_node(t_args->current_node_info->predecessor,t_args->current_node_info->successor,"SS\0",t_args->verbose_level);
    client_set_remote_node(t_args->current_node_info->successor,t_args->current_node_info->predecessor,"SP\0",t_args->verbose_level);
    printf("\n[!] STOP\n");

    exit(EXIT_SUCCESS);
}

void* die(void* args){

    die_args* d_args = (die_args*) args;

    pthread_mutex_lock(d_args->die_lock);
    //Server can start
    sem_post(d_args->die_ready);
    pthread_cond_wait(d_args->die_sleep, d_args->die_lock);
    pthread_mutex_unlock(d_args->die_lock);

    pthread_cancel(*(d_args->server));
    pthread_cancel(*(d_args->stabilize));
    pthread_cancel(*(d_args->fix));

    fprintf(stderr, "[!] STOP\n");
    exit(0);
}