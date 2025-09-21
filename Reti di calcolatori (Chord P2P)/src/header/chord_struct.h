#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <string.h>
#include <signal.h>
#include <gmp.h>        //Contains variable of 160 bits

#ifndef CHORD_STRUCT_H //Is a preprocessor directive in C that prevents a header file from being included multiple times during compilation.
#define CHORD_STRUCT_H

typedef struct {
    mpz_t id;
    char ip[46];
    int port;
    char host_domain[255];
}node;

typedef struct {
    mpz_t start;         //is the identifier that marks the beginning of the finger’s interval,
    mpz_t end;           //calculated as (n + 2^(i-1)) mod 2^m, where n is the current node’s ID
    node successor;
}finger_table_entry;

typedef struct {
    node predecessor;
    node successor;
    finger_table_entry *finger_table;     //Chord's documentation defines that the
}node_info;                               // finger table must have M entries, where M is the number of bits of the node ID (typically calculated using SHA-1).

typedef struct {
    sem_t* server_ready;
    short verbose_level;
    node current_node;
    node_info* current_node_info;
    pthread_mutex_t* finger_lock;
    sem_t* die_ready;
    pthread_mutex_t* die_lock;      //Data used by threads to cause the process to terminate
    pthread_cond_t* die_sleep;      //in die() function in chord.c
} server_args;

typedef struct{
    sem_t* server_ready;
    node current_node;
    node_info* current_node_info;
    pthread_mutex_t* finger_lock;
    pthread_mutex_t* list_lock;
    sem_t* backgrounds_ready;
    node *successors_list;
    int* list_length;
    short verbose_level;
    int refresh_time;
}stabilize_args;

typedef struct{
    pthread_t *server, *stabilize, *fix;
    sem_t *die_ready;
    pthread_mutex_t* die_lock;
    pthread_cond_t* die_sleep;
}die_args;

typedef struct{
    sem_t* server_ready;
    sem_t* backgrounds_ready;
    node current_node;
    pthread_mutex_t* finger_lock;
    pthread_mutex_t* list_lock;
    node_info* current_node_info;
    int* list_length;      //Contains the length of actual nodes in the list
    short verbose_level;
    node *successors_list;  //In this implementation it is possible have only max 160 successors node as backup
}successors_args;

typedef struct{
    sigset_t* set;
    node current_node;
    node_info* current_node_info;
    short verbose_level;
}signal_args;

#endif // CHORD_STRUCT_H