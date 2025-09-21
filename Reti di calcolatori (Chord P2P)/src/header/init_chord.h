#include <gmp.h>
#include "chord_struct.h"

extern int get_option( int argc, char *argv [], node* bootstrap, node* current_node, short* verbose_flag,int* refresh_time);
extern int dns_lookup(char* host_domain, char* host_ip_str, const short is_local);
extern int hash_sha1(node* current_node, const short verbose_flag);
extern int init_finger_table_interval(finger_table_entry **table,const node current_node);
extern void init_join_first(node_info *info, const node current_node,const short verbose_flag);
extern int init_finger_table(const node boostrap,const node current_node, node_info* current_node_info,const short verbose_flag);