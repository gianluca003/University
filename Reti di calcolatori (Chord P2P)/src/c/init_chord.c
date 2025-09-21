#include <stdio.h>
#include <stdlib.h>
#include <netdb.h>          //Definition of functions for DNS
#include <arpa/inet.h>      //Definition of functions that converts format of IP addresses (from number to string)
#include <unistd.h>         //Definition of functions to manage options from input options (prompt)
#include <regex.h>
#include <openssl/evp.h>
#include <string.h>
#include <math.h>
#include <gmp.h>
#include "../header/chord_struct.h"
#include "../header/chord.h"
#include "../header/client_chord.h"

#define RED   "\x1b[31m"
#define GREEN "\x1b[32m"
#define RESET "\x1b[0m"

int get_option( int argc, char *argv [], node* bootstrap, node* current_node, short* verbose_flag,int* refresh_time);
int dns_lookup(char* host_domain, char* host_ip_str, const short is_local);
int hash_sha1(node* current_node, const short verbose_flag);
int init_finger_table_interval(finger_table_entry **table,const node current_node);
void init_join_first(node_info *info, const node current_node,const short verbose_flag);
int init_finger_table(const node boostrap,const node current_node, node_info* current_node_info,const short verbose_level);

int get_option( int argc, char *argv [], node* bootstrap, node* current_node, short* verbose_flag,int* refresh_time){
    int opt;
    regex_t regex_ip;
    *verbose_flag=0;
    *refresh_time=0;

    regcomp(&regex_ip, "^0.*|((255)+)|((\\d{1,3}\\.){4,}\\d)|\\.*\\d{4,}|[a-z]|^(\\d{1,3}\\.){1,2}\\d{1,3}$|^\\d*$|\\.$", REG_EXTENDED); //regex valid only for IPv4

    //"optarg" variable is a global variable contained in "unistd.h"

    while ((opt = getopt(argc, argv, "hp:i:d:vb:q:t:")) != -1) {

        switch (opt) {
            case 'h':
                printf("[?] Help:\n"
                       "\n\t-i IP       \tSpecifies the ip address of the host node to be included in the chord ring.\n"
                       "\t              \tIf not specified the ip address of the host is taken automatically.\n"
                       "\t              \tID hash calculation uses the IP address.\n"
                       "\t-d DOMAIN NAME\tSpecifies the domain name of the host. Useful in cases where the ip is dynamic, using dns.\n"
                       "\t              \tID hash calculation uses the domain name.\n"
                       "\t              \tto compute the hash of the node ID.\n"
                       "\t-p PORT       \tSpecifies the port number the client will use to connect to the server.\n"
                       "\t              \tIf only the port is specified. To compute the hash of the node ID, the IP of the host node is automatically taken\n"
                       "\t-v[v][v]      \tVerbose. If add another v, the output will be more verbose (max 3).\n"
                       "\t-b BOOT IP    \tIP address of the bootstrap node, which is contacted by a new node to find its successor.\n"
                       "\t              \tIf not specify, try with a default bootstrap node. It is important add also the port.\n"
                       "\t-q BOOT PORT  \tPort number of bootstrap node, which is contacted by a new node to find its successor\n"
                       "\t              \tIf not specify, try with a default bootstrap node. It is important add also the IP.\n"
                       "\t-t TIME       \tDetermines the refresh time of an entry in the finger table. For example, if set to 1000 millisecond,\n"
                       "\t              \tit will take 160 seconds each time to refresh the entire table. If not specified,\n"
                       "\t              \tthe refresh will be set to 500ms.\n"
                       "\t-h            \tHelp option.\n\n"
                );
                return -1;
            case 'i':
                strcpy(current_node->ip,optarg);
                break;
            case 'd':
                strcpy(current_node->host_domain,optarg);
                break;
            case 'p':
                current_node->port = atoi(optarg);
                break;
            case 'v':
                ++(*verbose_flag);
                break;
            case 'b':
                strcpy(bootstrap->ip,optarg);
                break;
            case 'q':
                bootstrap->port = atoi(optarg);
                break;
            case 't':
                *refresh_time = atoi(optarg);
                break;
            default:
                fprintf(stderr, RED "[!] ERROR: %s [ -i IP | -d DOMAIN ] -p PORT [-v] [-b BOOTNODE IP -q BOOTNODE PORT] [-t SECONDS] | -h \n" RESET, argv[0]);
                return -1;
        }
    }

    if(*refresh_time<0){
        fprintf(stderr, RED "[!] ERROR: %d invalid refresh time (it must be >= 0)\n" RESET, *refresh_time);
        return -1;
    }

    if( *current_node->ip && !(regexec(&regex_ip, current_node->ip, 0, NULL, 0))){
        fprintf(stderr, RED "[!] ERROR: %s invalid IP\n" RESET, current_node->ip);
        return -1;
    }

    if((*current_node->ip && *current_node->host_domain)){
        fprintf(stderr, RED "[!] ERROR: %s [ -i IP | -d DOMAIN ] -p PORT [-v] [-b BOOTNODE IP -q BOOTNODE PORT] [-t SECONDS] | -h \n" RESET, argv[0]);
        return -1;
    }

    if (current_node->port <= 0 || current_node->port >= 65535) {
        fprintf(stderr, RED "[!] ERROR: Invalid port. It must be between 1 and 65534\n" RESET);
        return -1;
    }

    if( (*bootstrap->ip && (bootstrap->port <= 0 || bootstrap->port > 65535)) || (!(*bootstrap->ip) && bootstrap->port>0) ){
        fprintf(stderr, RED "[!] ERROR: Invalid bootstrap node (-b IP -q PORT)\n" RESET);
        return -1;
    }

    //Get IP from machine
    if(!(*current_node->ip) && !(*current_node->host_domain)){
        //Get hostname and get IP (local)
        if(dns_lookup(current_node->host_domain,current_node->ip,1) == -1)
            return -1;
    }

    //Get IP from DNS
    if(*current_node->host_domain){
        //Resolve the domain name to get IP
        if(dns_lookup(current_node->host_domain,current_node->ip,0) == -1)
            return -1;
    }

    if(!(*current_node->host_domain))
        *current_node->host_domain='\0';

    if(*verbose_flag)
        printf("[~] IP: %s\n    Server listen port: %d \n    Name: %s\n    Boostrap node: %s:%d\n"
               ,current_node->ip,current_node->port,current_node->host_domain,bootstrap->ip,bootstrap->port);
    return 0;
}

//This function is used for resolve domain name using a dns server
//If is_local=1 use etc/hosts to get IP of current macchine
int dns_lookup(char* host_domain, char* host_ip_str, const short is_local){

    struct addrinfo host_by_dns, *dns_res; //Variable use for search the IP by domain using DNS
    struct sockaddr_in *host_ipv4;
    char ip_str[BUFSIZ];

    memset(&host_by_dns, 0, sizeof(host_by_dns));
    host_by_dns.ai_family = AF_INET;

    if(is_local){
        //Get hostname
        if (gethostname(host_domain, sizeof(host_domain)) != 0) {
            fprintf(stderr, RED"[!] ERROR: A problem occur while get local hostname\n"RESET);
            return -1;
        }
    }

    if ((getaddrinfo(host_domain, NULL, &host_by_dns, &dns_res)!= 0)) {
        fprintf(stderr, RED"[!] ERROR: A problem occur while resolve %s domain name to IPv4\n"RESET,host_domain);
        return -1;
    }

    host_ipv4 = (struct sockaddr_in *) dns_res->ai_addr;

    inet_ntop(dns_res->ai_family, &(host_ipv4->sin_addr), ip_str, sizeof(ip_str)); //Transform IPv4 to string
    strcpy(host_ip_str,ip_str);

    return 0;
}

int hash_sha1(node *current_node, const short verbose_flag){
    char data[BUFSIZ];
    unsigned int hash_len;
    char hex_hash[EVP_MAX_MD_SIZE];
    char hex_byte[3];
    char str_port[BUFSIZ];
    unsigned char hash[EVP_MAX_MD_SIZE];
    EVP_MD_CTX *mdctx = EVP_MD_CTX_new();    //Context creation (for data of different hash phases)

    memset(data, 0, sizeof(data));
    strcpy(data,current_node->ip);
    strcat(data,":");

    if( sprintf(str_port, "%d", current_node->port)==-1){
        fprintf(stderr, RED"[!] ERROR: A problem occur while convert port number to string\n"RESET);
        return -1;
    }
    strcat(data,str_port);

    if(verbose_flag)
        printf("[~] Data to hash: %s\n",data);


    if (mdctx == NULL) {
        fprintf(stderr, RED"[!] ERROR: A problem occur while start SHA-1 (context data structure creation)\n"RESET);
        return -1;
    }

    //initialization SHA-1
    if (1 != EVP_DigestInit_ex(mdctx, EVP_sha1(), NULL)) {
        fprintf(stderr, RED"[!] ERROR: A problem occur while initialization digest\n"RESET);
        EVP_MD_CTX_free(mdctx);
        return -1;
    }

    //Hash data
    if (1 != EVP_DigestUpdate(mdctx, data, strlen(data))) {
        fprintf(stderr, RED"[!] ERROR: A problem occur while update digest value\n"RESET);
        EVP_MD_CTX_free(mdctx);
        return -1;
    }

    //Calculate final hash value
    if (1 != EVP_DigestFinal_ex(mdctx, hash, &hash_len)) {
        fprintf(stderr, RED"[!] ERROR: A problem occur while calculate final digest\n"RESET);
        EVP_MD_CTX_free(mdctx);
        return -1;
    }

    for (short i = 0; i < 20; i++)
        sprintf(hex_hash + (i * 2), "%02x", hash[i]);
    hex_hash[40] = '\0';

    mpz_init(current_node->id);

    if (mpz_set_str(current_node->id, hex_hash, 16) != 0) {
        fprintf(stderr, RED "[!] ERROR: A problem occurred while coping digest value\n" RESET);
        mpz_clear(current_node->id);
        return -1;
    }

    //Context free
    EVP_MD_CTX_free(mdctx);

    return 0;
}

int init_finger_table_interval(finger_table_entry **table,const node current_node){

    finger_table_entry* finger_table = (finger_table_entry*) calloc(160, sizeof(finger_table_entry*)*160);
    mpz_t temp_pow;
    mpz_t temp_add;
    mpz_t mod;      //contain 2^160 value

    if (finger_table == NULL) {
        fprintf(stderr, RED"[!] ERROR: A problem occur during finger table's initialization\n"RESET);
        return -1;
    }
    *table = finger_table;

    mpz_init(temp_pow);
    mpz_init(temp_add);
    mpz_init(mod);

    for(int i=0; i<160; i++){
        mpz_init((*table)[i].start);
        mpz_init((*table)[i].end);

    //Calculate start of interval = n+2^(i-1) mod 2^m
        mpz_ui_pow_ui(temp_pow, 2, i);                // 2^(i-1) because when i=0 exp become -1, shift all exp (start and end) by 1
        mpz_add(temp_add,current_node.id,temp_pow);     // n+2^(i-1)
        mpz_ui_pow_ui(mod, 2, 160);                     // 2^m
        mpz_mod((*table)[i].start, temp_add, mod);      // Final calculate

    //Calculate end of interval = n+2^(i) mod 2^m
        mpz_ui_pow_ui(temp_pow, 2, i+1);                  // 2^(i)
        mpz_add(temp_add,current_node.id,temp_pow);     // n+2^(i)
        mpz_ui_pow_ui(mod, 2, 160);                     // 2^m
        mpz_mod((*table)[i].end, temp_add, mod);        // Final calculate
    }
}

//When the current node is the first node in the ring
void init_join_first(node_info *info, const node current_node,const short verbose_flag){

    mpz_init(info->successor.id);
    mpz_init(info->predecessor.id);

    //When initializing the first node in a Chord network,
    //set both its successor and predecessor to point to itself
    node_copy(&info->successor,current_node);
    node_copy(&info->predecessor,current_node);

    if(verbose_flag)
       gmp_printf("[~] predecessor ID: %040Zx (local node)  successor ID: %040Zx (local node)\n",info->successor.id,info->predecessor.id);

    if(verbose_flag>1)
        printf("[~] Finger table initialization:\n");

    for(int i=0; i<160;i++){

        //Copy current_node as successor node for all entries
        node_copy(&info->finger_table[i].successor,current_node);

        if(verbose_flag>2){
            printf("    Entry number: %d\n",i);
            gmp_printf("    start: %040Zx\n",info->finger_table[i].start);
            gmp_printf("    end: %040Zx\n",info->finger_table[i].end);
            gmp_printf("    successor: %040Zx (local node)\n\n",info->finger_table[i].successor.id);
        }
    }
}

//When exists at least one node in the ring, and the use specify it
int init_finger_table(const node boostrap,const node current_node, node_info* current_node_info,const short verbose_flag){

    node node_successor;
    node_info node_successor_info;

    mpz_init(node_successor.id);
    mpz_init(node_successor_info.successor.id);
    mpz_init(node_successor_info.predecessor.id);


    //Get successor of new node using bootstrap node (which execute locally find_successor())
    if(client_get_remote_node(boostrap,current_node_info->finger_table[0].start,&node_successor,"FS\0",verbose_flag)<0)
        return -1;

    if(node_copy(&current_node_info->successor,node_successor)<0){
        fprintf(stderr, RED"[!] ERROR: A problem occur while copy successor node\n"RESET);
        return -1;
    }

    if(node_copy(&current_node_info->finger_table[0].successor,node_successor)<0){
        fprintf(stderr, RED"[!] ERROR: A problem occur while copy successor node\n"RESET);
        return -1;
    }

    //Set predecessor of new node
    if(client_get_remote_node_info(node_successor,&node_successor_info,verbose_flag)<0)
        return -1;

    if(node_copy(&current_node_info->predecessor,node_successor_info.predecessor)<0){
        fprintf(stderr, RED"[!] ERROR: A problem occur while copy predecessor node\n"RESET);
        return -1;
    }

    //Set predecessor of successor
    if(client_set_remote_node(node_successor,current_node,"SP\0",verbose_flag)<0)
        return -1;


    for(short i=0; i<159;i++){

        if(in_interval_left(current_node_info->finger_table[i+1].start,current_node.id,current_node_info->finger_table[i].successor.id)){
            node_copy(&current_node_info->finger_table[i+1].successor,current_node_info->finger_table[i].successor);
        }
        else{
            if(client_get_remote_node(boostrap,current_node_info->finger_table[i+1].start,&node_successor,"FS\0",verbose_flag)<0)
                return -1;
            node_copy(&current_node_info->finger_table[i+1].successor,node_successor);
        }

    }

    if(verbose_flag){
        gmp_printf("[~] predecessor ID: %040Zx\n",current_node_info->predecessor.id);
        gmp_printf("  successor ID: %040Zx",current_node_info->successor.id);
    }

    if(verbose_flag>2){

            printf("[~] Finger table initialization:\n");
        for(short i=0; i<160;i++){
                printf("    Entry number: %d\n",i);
                gmp_printf("    start: %040Zx\n",current_node_info->finger_table[i].start);
                gmp_printf("    end: %040Zx\n",current_node_info->finger_table[i].end);
                gmp_printf("    successor: %040Zx ",current_node_info->finger_table[i].successor.id);
                if(mpz_cmp(current_node.id,current_node_info->finger_table[i].successor.id)==0)
                    printf("(local node)");
            printf("\n\n");
        }
    }
    return 0;
}
