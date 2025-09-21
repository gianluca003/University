#include "../header/chord_struct.h"
#include <gmp.h>

extern int join(node bootstrap, node* current_node, node_info* current_node_info,pthread_mutex_t* finger_lock,short verbose_level);
extern void update_others( node current_node, node_info current_node_info,pthread_mutex_t* finger_lock, short verbose_level);
extern void update_finger_table(node current_node, node_info* current_node_info, node new_successor, int pos_finger_table,pthread_mutex_t* finger_lock, short verbose_level);
extern void* stabilize(void* args);
extern void notify(node current_node, node_info* current_node_info,pthread_mutex_t* finger_lock, node new_node);
extern void* fix_fingers(void* args);
extern void* update_successors_list(void* args);
extern node find_successor( mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock, short verbose_level);
extern node find_predecessor(mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock,node* output_successor, short verbose_level);
extern node closest_preceding_finger(const mpz_t id, const node current_node,const node_info current_node_info,pthread_mutex_t* finger_lock);
extern int in_interval_right(const mpz_t id_to_check, const mpz_t a, const mpz_t b);
extern int in_interval_left(const mpz_t id_to_check, const mpz_t a, const mpz_t b);
extern int in_interval_open(const mpz_t id_to_check, const mpz_t a, const mpz_t b);
extern int node_copy(node* dest_node, const node src_node);