#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include <ctype.h>
#include <sys/socket.h> //Libreria solo per linux
#include <arpa/inet.h> //Libreria solo per linux
#include <unistd.h> //Contiene metodo close() (close della socket)

#define COLOR_BLUE    "\x1b[34m"
#define COLOR_RED     "\x1b[31m"
#define COLOR_GREEN   "\x1b[32m"
#define COLOR_RESET   "\x1b[0m"


enum cella{vuota_colpita=-3, orizzontale_colpita=-2, verticale_colpita=-1, verticale = 1, orizzontale=2}
;
typedef struct campo{
    int **campo;
    int righe;
    int colonne;
    int celleOccupate;
}campo;
typedef struct coordinate{
    char colonna;
    int riga;
}coordinate;


static void eliminaN(char* str){

    int i = 0;

    while(str[i]!='\0' && str[i]!='\n')
        i++;

    if(str[i]=='\n')
        str[i]='\0';
}
static void strLowerCase(char* str){
    int i=0;

    while(str[i]!='\0'){
        str[i] = tolower(str[i]);
        i++;
    }
}
//La funzione si aspetta che la stringa abbia già lo spazio sufficiente per aggiungere \n
static void aggiungiN(char *str){

    int i=0;

    for(; str[i]!='\0';i++);

    str[i]='\n';
    str[i+1]='\0';

}

int connessione(const char *ip,const int porta){

    int socket_d; //Socket descriptor
    struct sockaddr_in server_add; //Variabile per inserire i parametri del server

    //AF_INET: Indirizzo IPv4; SOCK_STREAM: TCP; 0: IP
    socket_d = socket(AF_INET,SOCK_STREAM, 0);

    //Controllo che la socket sia stata creata correttamente
    if(socket_d < 0)
        return -1;

    //Assegno i parametri del server
    server_add.sin_family=AF_INET; //Specifica il tipo di indirizzo IP da usare (IPv4)
    server_add.sin_port = htons(porta); //Converte il numero di porta in un formato idoneo al segmento TCP

    //Converte i parametri nel formato binario adatto al pacchetto
    if(inet_pton(AF_INET, ip,&server_add.sin_addr) <= 0)
        return -1;

    //Prova a connettersi con il server
    if(connect(socket_d,(struct sockaddr*)&server_add,sizeof(server_add)) < 0)
        return -1;

    return socket_d;
}

int cercaAvversario(const int socket, const char* pin, const campo mioCampo){

    char buffer[1024];
    int flag;

    //Mando il pin
    send(socket, pin, strlen(pin), 0);

    //Converto il numero di righe in stringhe e lo mando
    sprintf(buffer, "%d", mioCampo.righe);
    //Aggiungo il \n perché il server per leggere il dato fa una "readLine()"
    aggiungiN(buffer);
    send(socket, &buffer, strlen(buffer), 0);

    //Converto il numero di colonne in stringhe e lo mando
    sprintf(buffer, "%d", mioCampo.colonne);
    aggiungiN(buffer);
    send(socket, &buffer, strlen(buffer), 0);

    read(socket,buffer,sizeof(buffer));

    flag = atoi(buffer);
    return flag;
}

int**  creaCampo(const int righe, const int colonne){

    campo campo;

    campo.campo = (int **) malloc(sizeof(int*) * righe);
    for(int i=0; i<righe; i++)
        campo.campo[i] = (int*) malloc(colonne*sizeof(int));

    return campo.campo;
}

void schermataIniziale(){

    printf(COLOR_BLUE"\n"
                     "██████╗░░█████╗░████████╗████████╗░█████╗░░██████╗░██╗░░░░░██╗░█████╗   ███╗░░██╗░█████╗░██╗░░░██╗░█████╗░██╗░░░░░███████╗\n"
                     "██╔══██╗██╔══██╗╚══██╔══╝╚══██╔══╝██╔══██╗██╔════╝░██║░░░░░██║██╔══██╗  ████╗░██║██╔══██╗██║░░░██║██╔══██╗██║░░░░░██╔════╝\n"
                     "██████╦╝███████║░░░██║░░░░░░██║░░░███████║██║░░██╗░██║░░░░░██║███████║  ██╔██╗██║███████║╚██╗░██╔╝███████║██║░░░░░█████╗░░\n"
                     "██╔══██╗██╔══██║░░░██║░░░░░░██║░░░██╔══██║██║░░╚██╗██║░░░░░██║██╔══██║  ██║╚████║██╔══██║░╚████╔╝░██╔══██║██║░░░░░██╔══╝░░\n"
                     "██████╦╝██║░░██║░░░██║░░░░░░██║░░░██║░░██║╚██████╔╝███████╗██║██║░░██║  ██║░╚███║██║░░██║░░╚██╔╝░░██║░░██║███████╗███████╗\n"
                     "╚═════╝░╚═╝░░╚═╝░░░╚═╝░░░░░░╚═╝░░░╚═╝░░╚═╝░╚═════╝░╚══════╝╚═╝╚═╝░░╚═╝  ╚═╝░░╚══╝╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝╚══════╝╚══════╝\n\n"COLOR_RESET);

    printf("\t\t\t\t\t     A     B     C     D     E     F     G\n");
    printf("\t\t\t\t\t  ┏━██━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓\n");
    printf("\t\t\t\t\t  ┃ ██ ┃┃    ┃████████████████████████┃    ┃ 1\n");
    printf("\t\t\t\t\t  ┗━██━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛\n");
    printf("\t\t\t\t\t  ┏━██━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓\n");
    printf("\t\t\t\t\t  ┃ ██ ┃┃    ┃┃    ┃┃    ┃┃    ┃┃    ┃┃ XX ┃ 2\n");
    printf("\t\t\t\t\t  ┗━██━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛\n");
    printf("\t\t\t\t\t  ┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓\n");
    printf("\t\t\t\t\t  ┃    ┃┃    ┃██████░░░░░░██████┃    ┃┃    ┃ 3\n");
    printf("\t\t\t\t\t  ┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛\n");
    printf("\t\t\t\t\t  ┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓┏━━━━┓\n");
    printf("\t\t\t\t\t  ┃ XX ┃┃ XX ┃┃    ┃┃    ┃┃    ┃┃    ┃┃    ┃ 4\n");
    printf("\t\t\t\t\t  ┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛┗━━━━┛\n\n");

    printf(COLOR_BLUE"┃ PREMI INVIO ┃\n" COLOR_RESET);

    while(getchar()!='\n');

}

void stampaCampo(const campo campo){
    //Stampo le lettere del campo
    for(int i=0; i<campo.colonne;i++)
        printf("   %c  ", (char) (65+i));
    printf("\n");

    for(int i=0; i<campo.righe; i++){

        //Stampo ogni singolo quadrato di una riga

        //Prima stampo la "testa" della nave
        for(int y=0; y<campo.colonne; y++)
            switch (campo.campo[i][y]) {
                case verticale: printf("┏━██━┓"); break;
                case verticale_colpita: printf("┏━░░━┓"); break;
                default: printf("┏━━━━┓");
            }
        printf("\n");

        //Stampo il "corpo" della nave
        for(int y=0; y<campo.colonne;y++){
            switch (campo.campo[i][y]) {
                case verticale: printf("┃ ██ ┃"); break;
                case orizzontale: printf("██████"); break;
                case verticale_colpita: printf("┃ ░░ ┃"); break;
                case orizzontale_colpita: printf("░░░░░░"); break;
                case vuota_colpita: printf("┃ xx ┃"); break;
                default: printf("┃    ┃"); break;
            }
            if(y==campo.colonne-1) printf(" %d",i);
        }
        printf("\n");

        //stampo la fine della nave
        for(int y=0; y<campo.colonne; y++)
            switch (campo.campo[i][y]) {
                case verticale: printf("┗━██━┛"); break;
                case verticale_colpita: printf("┗━░░━┛"); break;
                default: printf("┗━━━━┛");

            }
        printf("\n");
    }

}

void inizializzaCampo(campo campo){
    for(int i=0;i<campo.righe;i++)
        for(int j=0;j<campo.colonne;j++)
            campo.campo[i][j]=0;

}

void stampaMenuNavi(int navi_disponibili)   {

    int salta_lettera=0; //Fa in modo che alle barche verticali venga assegnata una lettera 'dispari' e alle orizzontali una 'pari'

    for(int i=0;i<navi_disponibili;i++){

        printf("%c)", (char)97 + i + salta_lettera);

        //Nave verticale
        for(int y=1+i; y>0; y--)
            printf("\n┏━██━┓\n┃ ██ ┃\n┗━██━┛");

        salta_lettera++;
        printf("\t%c)\n\t", (char)97 + i + salta_lettera);

        for(int j=1+i; j>0; j--) printf("┏━━━━┓");
        printf("\n\t");
        for(int j=1+i; j>0; j--) printf("██████");
        printf("\n\t");
        for(int j=1+i; j>0; j--) printf("┗━━━━┛");
        printf("\n\t");

        printf("\n");
    }
}

int celleNave(const char c,const int max_nave){

    int a;
    //Il contatore parte da 1 (cella) perché nel caso la lettera fosse proprio 'a', non entrerebbe nel ciclo
    //In ogni caso viene fatto un controllo nel return
    int contatore = 1;

    //Questo ciclo parte dalla lettera 'a' (in ascii 97), e cicla fin quando non trova lo stesso codice ascii della lettera passata
    // (o si ferma appena arriva alla fine delle navi disponibili)
    //Il contatore di celle si incrementa ogni volta che trova un numero pari (ogni 2 lettere)
    //Questo perché ogni nave ha 2 tipi (verticale e orizzontale)
    for(a = 97; a != (int)c && a < 97 + (max_nave)*2; a++)
        if(a%2==0)
            contatore++;


    //Se l'ascii corrisponde al numero incrementato nel ciclo, allora è stato trovata la nave, e viene mandato
    //il contatore, altrimenti manda -1 per segnalare che è arriivato alla fine del ciclo senza trovare la nave
    return a==(int)c?contatore:-1;
}

int posizionaNave(campo campo, const coordinate coord, const int verso, const int celle_nave){

    int riga=coord.riga;
    int colonna=(int)coord.colonna;
    int i;

    //Controllo che la colonna abbia una lettera maiuscola
    if(colonna<65 || colonna>90)
        return -1;

    //Controllo che la cella indicata dalla cordinata sia contenuta nel campo
    if((64+campo.colonne < colonna|| campo.righe <= riga ))
        return -1;

    //Assegno alla colonna un valore numerico compreso tra 0 e 25 (A-Z)
    colonna= colonna-65;

    if(verso==verticale){
        //Controllo che la nave non esca dal campo
        if((riga + celle_nave) > campo.righe)
            return -1;

        //Controllo che le caselle non siano già occupate
        for(i=riga; i < celle_nave && campo.campo[i][colonna]==0; i++);
        if(campo.campo[i][colonna]!=0)
            return -1;

        //Imposto tot. celle a 1, partendo da quella indicata
        for(i=riga; i < riga + celle_nave; i++)
            campo.campo[i][colonna]=verticale;
    }

    if(verso==orizzontale){
        //Controllo che la nave non esca dal campo
        if((colonna+celle_nave) > campo.colonne)
            return -1;

        //Controllo che le caselle non siano già occupate
        for(i=colonna; i<colonna && campo.campo[riga][i]==0; i++);
        if(campo.campo[riga][i]!=0)
            return -1;

        //Imposto tot. celle a 2, partendo da quella indicata
        for(i=colonna; i<colonna+celle_nave; i++)
            campo.campo[riga][i]=orizzontale;
    }

    return 0;
}

int str_to_coord(const char* str, coordinate* coord){

    //Creo un array per inserire la riga. Questo perché la riga può essere max 100
    char riga[3];
    char colonna;
    int i; //Conterrà la prima posizione dei valori cercati
    int flag = 0; //valore che ritorneremo al chiamante, se flag = 2 significa che sono stati settati correttamente le coordinate

    //Cerco la posizione della prima cifra del numero che compone la riga
    for(i = 0; ((int)str[i]<48 || (int)str[i]>57)  &&  i<strlen(str); i++);

    //Controllo di averla trovata
    if((int)str[i]>47 && (int)str[i]<58){
        //Partendo dalla posizione trovata, inserisco le cifre nell'array 'riga', fin quando
        //non sono alla fine della stringa (\0), fin quando non trovo una cifra (quindi trovo una lettera)
        //o fin quando arrivo alla lettura di 3 cifre
        for(int y=i; i<strlen(str) && ((int)str[y]>47 && (int)str[y]<58) && y<i+3; y++)
            riga[y-i]=str[y];

        if(strlen(riga)!=0){
            coord->riga= atoi(riga);
            flag++;
        }
    }

    //Prima di continuare controllo se la riga è stata inserita correttamente
    if(flag==1){
        //Cerco la posizione della lettera
        for(i=0; ((str[i]<65 || str[i]>90) && (str[i]<97 || str[i]>122)) && i<strlen(str);i++);

        //Controllo di averla trovata, e controllo se la riga è stata inserita correttamente
        if((str[i]>64 && str[i]<91) || (str[i]>96 && str[i]<123)){
            flag++;
            colonna=str[i];
            colonna = toupper(colonna);
            coord->colonna=colonna;
        }
    }



    return flag==2?1:-1;
}

int versoNave(const char nave){
    //Le navi con le 'lettere pari' sono quelle orizzontali, quelle dispari verticali
    return (int)nave%2==0?orizzontale:verticale;
}

void finePreparazione(const int socket){
    //Metto il \n perché il server usa il metodo readLine()
    char segnale[] = {"READY\n\0"};
    send(socket,segnale, strlen(segnale),0);
}

int attendiPreparazioneAvversario(const int socket){
    char buffer[1024];

    read(socket,buffer,sizeof(buffer));

    return strcmp(buffer,"READY\n")==0?1:0;
}

int righeCampoAvversario(const int socket){
    char buffer[1024];
    int n;
    read(socket,buffer,sizeof (buffer));
    n = atoi(buffer);

    return n;
}

int colonneCampoAvversario(const int socket){
    char buffer[1024];
    int n;
    read(socket,buffer,sizeof (buffer));
    n = atoi(buffer);

    return n;
}

int mioTurno(const int socket){
    char buffer[1024];
    int flag;

    read(socket,buffer,sizeof(buffer));
    flag = atoi(buffer);

    return flag;
}

void inviaCoordinate(const int socket, const char* coord){
    send(socket, coord, strlen(coord),0);
}

void riceviCoordinate(const int socket, char* str){

    char buffer[1024];
    read(socket,buffer,sizeof(buffer));
    strcpy(str,buffer);
}

int riceviRiscontro(const int socket){
    char buffer[1024];
    int n;

    read(socket,buffer,sizeof(buffer));
    n = atoi(buffer);

    return n;
}

void inviaRiscontro(const int socket,const int n){
    char buffer[1024];
    sprintf(buffer,"%d",n);
    aggiungiN(buffer);
    send(socket,buffer, strlen(buffer),0);
}

int getCellaColpita(int tipoCella){

    //Se lo stato è già negativo (quindi colpito) allora ritorno -10
    if(tipoCella<0)
        return 0;

    //Se lo stato é uguale a 0 allora ritorno -3 (che stamperà 'xx'), altrimenti il negato del valore
    return tipoCella!=0?-tipoCella:-3;
}

void aggiornaCampo(campo campo, const coordinate coord, int tipoCella){

    //Innanzitutto controliamo che la coordinata sia all'interno del campo.
    //Nel caso non sia presente non verrà comunque segnalato, faceando "perdere" un turno all'avversario

    //La colonna deve essere compresa tra 'A' e l'ultima colonna
    if( 65 <= (int)coord.colonna < 65+campo.colonne && 0 <= coord.riga < campo.righe )
        campo.campo[coord.riga][(int)coord.colonna-65] = tipoCella;
}

int getCella(const campo campo, const coordinate coord){

    if( (65 <= (int)coord.colonna && (int)coord.colonna < 65+campo.colonne) && (0 <= coord.riga && coord.riga < campo.righe) )
        return campo.campo[coord.riga][(int)coord.colonna-65];

    return -10;
}

void continuaPartita(const int socket){
    char* buffer = {"CONTINUE\n\0"};
    send(socket,buffer,strlen(buffer),0);
}

void finePartita(const int socket){
    char* buffer = {"STOP\n\0"};
    send(socket,buffer,strlen(buffer),0);
}

static void invioVerifica(const int socket, const int vincitore){
    char buffer[] ={"ME\n\0"};

    if(vincitore == 2){
        buffer[0]='A'; buffer[1]='V';
    }

    send(socket,buffer,strlen(buffer),0);
}

static int riceviVerifica(const int socket){
    char buffer[1024];

    read(socket,buffer,sizeof(buffer));

    return strcmp(buffer,"VALID\n")==0?1:-1;
}

int verificaVittoria(const int socket, const int vincitore){

    int flag;

    invioVerifica(socket, vincitore);
    flag = riceviVerifica(socket);

    return flag;

}

void schermataSconfitta(){
    printf(COLOR_RED "Sconfitta...\n");
    printf("░█▀▄░▄▀▀▄░█░░▄▀▀▄░░▀░░▀█▀░▄▀▀▄░░░█▀▀░░░█▀▀▄░█▀▀░█▀▀░▄▀▀▄░█▀▀▄░█▀▄░█▀▀▄░▀█▀░▄▀▀▄\n"
           "░█░░░█░░█░█░░█▄▄█░░█▀░░█░░█░░█░░░█▀▀░░░█▄▄█░█▀░░█▀░░█░░█░█░▒█░█░█░█▄▄█░░█░░█░░█\n"
           "░▀▀▀░░▀▀░░▀▀░█░░░░▀▀▀░░▀░░░▀▀░░░░▀▀▀░░░▀░░▀░▀░░░▀░░░░▀▀░░▀░░▀░▀▀░░▀░░▀░░▀░░░▀▀░\n\n" COLOR_RESET);
}

void schermataVittoria(){
    printf(COLOR_GREEN"Complimenti hai vinto...\n");
    printf("░▒█░░▒█░░▀░░▀█▀░▀█▀░▄▀▀▄░█▀▀▄░░▀░░█▀▀▄\n"
           "░░▒█▒█░░░█▀░░█░░░█░░█░░█░█▄▄▀░░█▀░█▄▄█\n"
           "░░░▀▄▀░░▀▀▀░░▀░░░▀░░░▀▀░░▀░▀▀░▀▀▀░▀░░▀\n\n"COLOR_RESET);
}

void termina (const int socket){
    close(socket);
}