#include <stdio.h>
#include <pthread.h>
#include <gmp.h>
#include <unistd.h>
#include "../header/init_chord.h"
#include "../header/chord_struct.h"
#include "../header/client_chord.h"
#include "../header/server_chord.h"

#define RED   "\x1b[31m"
#define GREEN "\x1b[32m"
#define RESET "\x1b[0m"

int join(node bootstrap, node* current_node, node_info* current_node_info,pthread_mutex_t* finger_lock,short verbose_level);
void update_others( node current_node, node_info current_node_info,pthread_mutex_t* finger_lock, short verbose_level);
void update_finger_table(node current_node, node_info* current_node_info, node new_successor, int pos_finger_table,pthread_mutex_t* finger_lock, short verbose_level);
void* stabilize(void* args);
void notify(node current_node, node_info* current_node_info,pthread_mutex_t* finger_lock, node new_node);
void* fix_fingers(void* args);
void* update_successors_list(void* args);
node find_successor( mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock, short verbose_level);
node find_predecessor(mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock,node* output_successor, short verbose_level);
node closest_preceding_finger(const mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock);
int in_interval_right(const mpz_t id_to_check, const mpz_t a, const mpz_t b);
int in_interval_left(const mpz_t id_to_check, const mpz_t a, const mpz_t b);
int in_interval_open(const mpz_t id_to_check, const mpz_t a, const mpz_t b);
int node_copy(node* dest_node, const node src_node);

int join(node bootstrap, node* current_node, node_info* current_node_info,pthread_mutex_t* finger_lock,short verbose_level){

    //Only fill interval value
    if(init_finger_table_interval(&current_node_info->finger_table,*current_node)<0)
        return -1;

    if(*bootstrap.ip && (bootstrap.port>0 && bootstrap.port<65535)){
        if(init_finger_table(bootstrap,*current_node,current_node_info,verbose_level)<0)
            return -1;
        update_others(*current_node,*current_node_info,finger_lock,verbose_level);
    } else{
        //If the user doesn't specify a bootstrap node, assume that the current node is the first node in the chord ring
        init_join_first(current_node_info,*current_node,verbose_level);
        node_copy(&current_node_info->predecessor,*current_node);
    }
    return 0;
}

void update_others(const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock, short verbose_level){

    node p; //Is the node that may need to update its i-th finger to point to the new node n.
    mpz_t temp_pow;
    mpz_t id_to_find;
    int temp_exp;

    mpz_init(temp_pow);
    mpz_init(id_to_find);

    for(short i=0;i<160;i++){
        temp_exp = (i-1<0)?0:i-1;                           //Avoid to obtain -1 in the first cycle
        mpz_ui_pow_ui(temp_pow, 2, temp_exp);               //2^(i-1)
        mpz_sub(id_to_find,current_node.id , temp_pow);     //n-2^(i-1)
        //find_predecessor(n-2^(i-1)). n= current node (id)
        p = find_predecessor(id_to_find,current_node,current_node_info,finger_lock,NULL,verbose_level);
        client_update_remote_table(p,current_node,i,verbose_level);
    }
}

void update_finger_table(node current_node, node_info* current_node_info, node new_successor, int pos_finger_table,pthread_mutex_t* finger_lock,short verbose_level){

    node p;

    pthread_mutex_lock(finger_lock);
    //if new_node ∈ [current_node, finger[i].successor)
    if(in_interval_left(new_successor.id,current_node.id,current_node_info->finger_table[pos_finger_table].successor.id)){
        node_copy(&current_node_info->finger_table[pos_finger_table].successor,new_successor);
        //get first node preceding n (current node)
        node_copy(&p,current_node_info->predecessor);

        if(verbose_level>2)
            gmp_printf("[~] UPDATE: finger[%d] successor changed to %s:%d (%040Zx)\n",pos_finger_table,new_successor.ip,new_successor.port, new_successor.id);

        pthread_mutex_unlock(finger_lock);

        client_update_remote_table(p,new_successor,pos_finger_table,0);
    }else
        pthread_mutex_unlock(finger_lock);
}

void* stabilize(void* args){

    stabilize_args* t_args = (stabilize_args*) args;
    node_info successor_info;
    int sleep_time, list_length;
    node x;      //This node will contain predecessor's successor of current node
    int index_successors_list = 0,try_connection = 0; //Try_connection keep track of number of connection that node is trying to do to his successor
    node backup_successor;

    mpz_init(successor_info.predecessor.id);
    mpz_init(successor_info.successor.id);
    mpz_init(x.id);

    sleep_time = (t_args->refresh_time>0?t_args->refresh_time*1000 : 500000);

    sem_wait(t_args->server_ready);

    printf("[~] STABILIZE: Thread initialized and running in background\n");
    sem_post(t_args->backgrounds_ready); //Main can continue

    while (1){

        //Get successor of current node
            if(client_get_remote_node_info(t_args->current_node_info->successor,&successor_info,t_args->verbose_level)<0){
                gmp_printf(RED "[!] STABILIZE ERROR: Problem occurred while contacting successor of current node: %040Zx (%s:%d)\n" RESET
                                                                                        ,t_args->current_node_info->successor.id
                                                                                        ,t_args->current_node_info->successor.ip
                                                                                        ,t_args->current_node_info->successor.port);

                try_connection++;
                pthread_mutex_lock(t_args->list_lock);
                list_length=*t_args->list_length;
                pthread_mutex_unlock(t_args->list_lock);

                if(try_connection>3 && list_length>0){

                    index_successors_list++;

                    if(index_successors_list>=list_length){
                        node_copy(&t_args->current_node_info->successor,t_args->current_node);
                        node_copy(&t_args->current_node_info->predecessor,t_args->current_node);
                        index_successors_list=0;
                        printf("[~] UPDATE: This is the only node in the ring\n");
                    }
                    else{
                        pthread_mutex_lock(t_args->list_lock);
                        node_copy(&backup_successor,t_args->successors_list[index_successors_list]);
                        pthread_mutex_unlock(t_args->list_lock);

                        pthread_mutex_lock(t_args->finger_lock);
                        node_copy(&t_args->current_node_info->successor,backup_successor);

                        gmp_printf("[~] UPDATE NEW SUCCESSOR: new successor %040Zx (%s:%d)\n" ,t_args->current_node_info->successor.id
                                ,t_args->current_node_info->successor.ip
                                ,t_args->current_node_info->successor.port);

                        client_set_remote_node(t_args->current_node_info->successor,t_args->current_node,"SP\0",t_args->verbose_level);
                        pthread_mutex_unlock(t_args->finger_lock);
                    }
                    try_connection=0;
                }

            }
            else{
                try_connection=0;
                node_copy(&x,successor_info.predecessor);
                //successor.predecessor ∈ (current_node, successor)
                if(in_interval_open(x.id,t_args->current_node.id,t_args->current_node_info->successor.id)){

                    pthread_mutex_lock(t_args->finger_lock);
                    node_copy(&t_args->current_node_info->successor,x);
                    pthread_mutex_unlock(t_args->finger_lock);
                }
                //successor.notify(n);
                client_notify_successor_node(t_args->current_node_info->successor,t_args->current_node,t_args->verbose_level);
            }

        usleep(sleep_time);  //sleep in milliseconds
    }
}

void notify(node current_node, node_info* current_node_info,pthread_mutex_t* finger_lock, node new_node){

    pthread_mutex_lock(finger_lock);
    //if(current node predecessor is nil or new node ∈ (current node predecessor, current node)
    if( mpz_cmp_ui(current_node_info->predecessor.id, 0) == 0
        || in_interval_open(new_node.id,current_node_info->predecessor.id,current_node.id))
        node_copy(&current_node_info->predecessor,new_node);
    pthread_mutex_unlock(finger_lock);
}

void* fix_fingers(void* args){

    stabilize_args* t_args = (stabilize_args*) args;
    int sleep_time;
    node successor;
    int i = 0;

    sleep_time = (t_args->refresh_time>0?t_args->refresh_time*1000 : 500000);

    sem_wait(t_args->server_ready);

    mpz_init(successor.id);

    printf("[~] FIX FINGERS: Thread initialized and running in background\n");
    sem_post(t_args->backgrounds_ready); //Main can continue

    while(1){

            //finger[i].successor = find_successor(finger[i].start)
            successor = find_successor(t_args->current_node_info->finger_table[i].start,
                                       t_args->current_node,
                                       *t_args->current_node_info,
                                       t_args->finger_lock,t_args->verbose_level);

            if(mpz_cmp(successor.id,t_args->current_node_info->finger_table[i].successor.id)!=0){
                pthread_mutex_lock(t_args->finger_lock);
                node_copy(&t_args->current_node_info->finger_table[i].successor,successor);
                pthread_mutex_unlock(t_args->finger_lock);

                if(t_args->verbose_level>2)
                    gmp_printf("[~] UPDATE: finger[%d] successor changed to %s:%d (%040Zx)\n",i,successor.ip,successor.port,successor.id);
            }
            i = ((i+1) % 160); //If i>159, the refresh restart

            usleep(sleep_time);  //sleep in milliseconds
    }
}

void* update_successors_list(void* args){

    successors_args* t_args = (successors_args*) args;
    int list_index=0;
    node remote_node, node_to_add;
    node_info info;

    sem_wait(t_args->server_ready);

    pthread_mutex_lock(t_args->finger_lock);
    node_copy(&remote_node,t_args->current_node_info->successor);
    pthread_mutex_unlock(t_args->finger_lock);

    *t_args->list_length=0;

    printf("[~] UPDATE SUCCESSORS LIST: Thread initialized and running in background\n");
    sem_post(t_args->backgrounds_ready); //Main can continue

    while(1){

        if( *t_args->list_length<160 &&
            client_get_remote_node_info(remote_node,&info,t_args->verbose_level)>-1){

                if(mpz_cmp(t_args->current_node.id,info.successor.id) != 0 ){

                    pthread_mutex_lock(t_args->list_lock);
                    node_copy(&t_args->successors_list[list_index],info.successor);
                    *t_args->list_length=list_index+1;
                    pthread_mutex_unlock(t_args->list_lock);

                    if(t_args->verbose_level>2)
                        gmp_printf("[~] UPDATE SUCCESSORS LIST: successors_list[%d] save successor (%040Zx)\n",list_index,info.successor.id);

                    list_index = (list_index<160? list_index+1:0);

                /*    if(list_index==0){
                        pthread_mutex_lock(t_args->finger_lock);
                        node_copy(&remote_node,t_args->current_node_info->successor);
                        pthread_mutex_unlock(t_args->finger_lock);
                    } else
                        node_copy(&remote_node,info.successor);
                        */
                if(list_index!=0)
                    node_copy(&remote_node,info.successor);
                } else{
                    pthread_mutex_lock(t_args->list_lock);
                    *t_args->list_length=list_index+1;

                    pthread_mutex_unlock(t_args->list_lock);

                    list_index=0;
/*
                    pthread_mutex_lock(t_args->finger_lock);
                    node_copy(&remote_node,t_args->current_node_info->successor);
                    pthread_mutex_unlock(t_args->finger_lock);*/
                }
            } /*else{
            pthread_mutex_lock(t_args->finger_lock);
            node_copy(&remote_node,t_args->current_node_info->successor);
            pthread_mutex_unlock(t_args->finger_lock);
        }*/
        pthread_mutex_lock(t_args->finger_lock);
        node_copy(&remote_node,t_args->current_node_info->successor);
        pthread_mutex_unlock(t_args->finger_lock);
        sleep(1); //Every second
    }

}

node find_successor( mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock, short verbose_level){
    node successor;
    //The find_predecessor function returns the predecessor and outputs its successor,
    //allowing find_successor to return the successor directly without extra network calls.
    find_predecessor(id,current_node,current_node_info,finger_lock,&successor,verbose_level);

    return successor;
}

node find_predecessor(mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock,node* output_successor, short verbose_level){

    //Find_node corresponds n' and find_node_successor corresponds n'.successor in the official documentation
    node find_node;
    node find_node_successor;

    mpz_init(find_node.id);
    mpz_init(find_node_successor.id);

    node_copy(&find_node,current_node);

    pthread_mutex_lock(finger_lock);
    node_copy(&find_node_successor,current_node_info.successor); //Successor of current node n
    pthread_mutex_unlock(finger_lock);

    short first_time=1;

    if(mpz_cmp(current_node_info.successor.id,current_node.id) == 0 && mpz_cmp(current_node_info.predecessor.id,current_node.id) == 0){
        node_copy(output_successor,current_node);
        return current_node;
    }

    while(in_interval_right(id,find_node.id,find_node_successor.id)==0){

        //ID is not in the interval (n, n.successor], move to the closest preceding finger of ID
        //First time search locally
        if(first_time) {
            node_copy(&find_node,closest_preceding_finger(id, current_node, current_node_info, finger_lock));
            first_time=0;
        }
        else
            node_copy(&find_node,find_node_successor);

        //If ID is not in the interval, the node picks the closest preceding finger from its finger
        //table and contacts it over the network to continue the search.
        if(mpz_cmp(current_node.id,find_node.id)!=0){
            if(verbose_level > 1)
                printf("[~] FIND PREDECESSOR: Request forwarded to the node %s:%d\n", find_node.ip,find_node.port);

            client_get_remote_node(find_node,id,&find_node_successor,"CPF\0",verbose_level);

        }else
            node_copy(&find_node_successor, closest_preceding_finger(id,current_node,current_node_info,finger_lock));
    }

    if(output_successor!=NULL)
        node_copy(output_successor,find_node_successor);
    return find_node;
}

node closest_preceding_finger(const mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock){

    node return_node;

    mpz_init(return_node.id);

    pthread_mutex_lock(finger_lock);

    for(short i=159; i>=0; i--){

        //According to Chord's documentation, the interval is open: x∈(a,b)
        if(in_interval_open(current_node_info.finger_table[i].successor.id, current_node.id, id)){
            node_copy(&return_node,current_node_info.finger_table[i].successor);
            pthread_mutex_unlock(finger_lock);
            return return_node;
        }
    }

    pthread_mutex_unlock(finger_lock);
    return current_node;
}

int in_interval_right(const mpz_t id_to_check, const mpz_t a, const mpz_t b) {

    int cmp = mpz_cmp(a, b);
    // Checks if id_to_check ∈ (a, b] on the Chord ring
    if (cmp < 0) {
        // Normal interval: a < b
        // Check if id_to_check ∈ (a, b]
        return (mpz_cmp(a, id_to_check) < 0) && (mpz_cmp(id_to_check, b) <= 0);
    } else if (cmp > 0) {
        // Wrapped interval: a > b (e.g., (F, 3])
        // Check if id_to_check ∈ (a, max] ∪ [0, b]
        return (mpz_cmp(a, id_to_check) < 0) || (mpz_cmp(id_to_check, b) <= 0);
    } else {
        // a = b: degenerate interval
        return  1; //(mpz_cmp(id_to_check, a) == 0);
    }
}

int in_interval_left(const mpz_t id_to_check, const mpz_t a, const mpz_t b) {

    int cmp = mpz_cmp(a, b);

    if (cmp < 0) {
        // Normal interval: a < b
        return (mpz_cmp(a, id_to_check) <= 0) && (mpz_cmp(id_to_check, b) < 0);
    } else if (cmp > 0) {
        // Wrapped interval: a > b (e.g., [F, 3))
        return (mpz_cmp(a, id_to_check) <= 0) || (mpz_cmp(id_to_check, b) < 0);
    } else {
        // a == b: empty interval
        return 0;
    }
}

int in_interval_open(const mpz_t id_to_check, const mpz_t a, const mpz_t b) {

    int cmp = mpz_cmp(a, b);

    // Checks if id_to_check ∈ (a, b) on the Chord ring
    if (cmp < 0) {
        // Normal interval: a < b
        // Check if id_to_check ∈ (a, b)
        return (mpz_cmp(a, id_to_check) < 0) && (mpz_cmp(id_to_check, b) < 0);
    } else if (cmp > 0) {
        // Wrapped interval: a > b (e.g., (F, 3))
        // Check if id_to_check ∈ (a, max] ∪ [0, b)
        return (mpz_cmp(a, id_to_check) < 0) || (mpz_cmp(id_to_check, b) < 0);
    } else {
        // a == b: empty interval
        return mpz_cmp(id_to_check, a) != 0;
    }
}

int node_copy(node* dest_node, const node src_node){

    if(dest_node==NULL)
        return -1;

    mpz_init(dest_node->id);

    //Copy hash ID
    mpz_set(dest_node->id,src_node.id);

    //Copy IP address
    strcpy(dest_node->ip,src_node.ip);

    //Copy host domain
    strcpy(dest_node->host_domain,src_node.host_domain);

    //Copy port number
    dest_node->port = src_node.port;

    return 0;
}