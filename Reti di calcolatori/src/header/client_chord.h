#include <gmp.h>
#include "chord_struct.h"

extern int client_get_remote_node(node remote_node,mpz_t find_id, node* output_node,char* command, short verbose_level);
extern int client_get_remote_node_info(node remote_node, node_info* output_node, short verbose_level);
extern int client_set_remote_node(node remote_node, node send_node,char* command, short verbose_level);
extern int client_update_remote_table(node remote_node,node new_successor, short pos_table, short verbose_level);
extern int client_notify_successor_node(node remote_node, node current_node, short verbose_level);

