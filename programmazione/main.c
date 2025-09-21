#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include <ctype.h>
#include <sys/socket.h> //Libreria solo per linux
#include <arpa/inet.h> //Libreria solo per linux
#include <unistd.h> //Contiene metodo close() (close della socket)
#include "battagliaNavale.h"

/*
gcc -c -g battagliaNavale.c
gcc -c -g main.c
gcc -o main main.o battagliaNavale.o -lm
 ./main
*/

#define COLOR_RED     "\x1b[31m"
#define COLOR_GREEN   "\x1b[32m"
#define COLOR_YELLOW  "\x1b[33m"
#define COLOR_BLUE    "\x1b[34m"
#define COLOR_CYAN    "\x1b[36m"
#define COLOR_RESET   "\x1b[0m"
#define ANSI_STYLE_BOLD         "\x1b[1m"
#define ANSI_STYLE_ITALIC       "\x1b[3m"

void eliminaN(char* str);
void strLowerCase(char* str);

//Funzioni del main

int main(){
    campo campo_avversario;
    campo mioCampo;
    int dim_max_nave = 0;
    char pin_sessione[BUFSIZ];
    char personalizza_campo[BUFSIZ];
    int righe = 0, colonne = 0;
    int esito_cerca_avversario;
    char nave_scelta; //Utilizzo nel momento della scelta delle navi
    int contatore_celle_occupate = 0;
    int celle_occupabili = 0;
    int stato_mia_cella = 0, stato_avversario_cella=0;
    const char* ip = "127.0.0.1";
    const int porta = 54322;
    coordinate coord;
    char posizione_nave[BUFSIZ];
    char coord_inviate[BUFSIZ];
    char coord_ricevute[BUFSIZ];
    int verifica_vincitore = 0;
    int socket; //Conterrà il socket descriptor

    schermataIniziale();

//In questo punto vengono inseriti le dimensioni del mioCampo + scelta del pin

    //Chiedo all'utente se desidera personalizzare la dimensione del mioCampo
    do{
        printf("Desideri personalizzare la grandezza del campo? (Dimesione di default: 6 x 10)\n(Si/No): ");
        fgets(personalizza_campo,BUFSIZ,stdin);
        printf("\n");
        eliminaN(personalizza_campo);
        strLowerCase(personalizza_campo);
    }while(strcmp(personalizza_campo,"si")!=0 && strcmp(personalizza_campo,"no")!=0);

    //Chiedo all'utente le dimensioni del mioCampo personalizzato
    if(strcmp(personalizza_campo,"si")==0){

        do{
            printf("Inserisci il numero di righe (max 100): ");
            scanf("%d",&righe);
            printf("\n");
        }while(righe<2 || righe>100);

        //Controllo che il numero di colonne inserito non sia maggiore di 26 (A-Z)
        do{
            printf("Inserisci il numero di colonne (max 26: A-Z): ");
            scanf("%d",&colonne);
            printf("\n");
        }while(colonne<2 || colonne>26);

        mioCampo.righe=righe;
        campo_avversario.righe=righe;

        mioCampo.colonne=colonne;
        campo_avversario.colonne=colonne;

        while(getchar()!='\n'); //Pulisce il buffer
    }
        //Altrimenti inserisco i valori di default
    else{
        mioCampo.righe = 6;
        mioCampo.colonne = 10;

        //Il mioCampo avversario deve essere uguale a quello dell'utente
        campo_avversario.righe = 6;
        campo_avversario.colonne = 10;
    }

    mioCampo.campo = creaCampo(mioCampo.righe, mioCampo.colonne);
    campo_avversario.campo = creaCampo(campo_avversario.righe, campo_avversario.colonne);

    //Le navi devono occupare il 18% del mioCampo. 18% delle celle
    mioCampo.celleOccupate = (int) round(0.18 * (mioCampo.righe * mioCampo.colonne));
   campo_avversario.celleOccupate = (int) round(0.18 * (mioCampo.righe * mioCampo.colonne));

        //Il gioco parte solo se il mioCampo si è creato
        if(mioCampo.campo == NULL || campo_avversario.campo == NULL){ //|| campo_avversario.mioCampo == NULL
            printf(COLOR_RED"Errore durante la creazione del campo!\n"COLOR_RESET);
        }
        else{

            //Controllo che il pin inserito abbia almeno 4 caratteri
            do{
                printf("Inserisci un pin per iniziare/partecipare (min. 4 caratteri): ");
                fgets(pin_sessione,BUFSIZ,stdin);
                printf("\n");
            }while(strlen(pin_sessione)<5);

//In questo punto avviene la connesione al server

            printf(COLOR_YELLOW "Connessione al server...\n" COLOR_RESET);

    //1 param: Conterrà le info del thread; 2 param: Attributi particolari da assegnare al thread (con NULL si usano quelli di default)
    //3 param: Indirizzo del puntatore a funzione; 4 param: Argomenti della funzione passata
   // pthread_create(&exit, NULL, abbandona, NULL); //Thread per abbandonare il gioco in qualsiasi momento (a partire dalla connessione)

            socket = connessione(ip,porta);

            if(socket==-1){
                printf(COLOR_RED "Connessione fallita!\n" COLOR_RESET);
            }
                //Se si connette al server allora inizia la ricerca dell'avversario
            else{
                printf(COLOR_GREEN "Connesso!\n"COLOR_RESET);
                printf(COLOR_YELLOW "Ricerca avversario...\n" COLOR_RESET);

                // Se n=0 significa che è stato trovato un giocatore con lo stesso pin e stesse dimensioni del mioCampo
                //Se n=1 Significa che è stato trovato un giocatore con lo stesso pin ma dimensioni del mioCampo diverse
                //Se n=-1 significa che è già in corso una partita con quel pin
                //Se il server non trova un avversario, il client rimane in attesa di un riscontro da parte del client
                esito_cerca_avversario = cercaAvversario(socket, pin_sessione, mioCampo);

        //Avvisa l'utente che la sessione è già in corso, ed esce dal programma
                if(esito_cerca_avversario == -1)
                    printf(COLOR_YELLOW "Sono già presenti 2 giocatori nella sessione %s" COLOR_RESET, pin_sessione);

    //Avvisa il giocatore che le dimensioni dei campi sono diverse e termina
               else if(esito_cerca_avversario == 1){
                    printf(COLOR_RED "Dimensione dei campi diversi!\n" COLOR_RESET);

                    //n conterrà il numero di righe e m il numero di colonne dell'avversario
                    //Bisogna fare attenzione all'ordine della chiamate, il server manda prima
                    //il numero di righe e successivamente il numero di colonne
                    righe = righeCampoAvversario(socket);
                    colonne = colonneCampoAvversario(socket);

                    //Adatto le dimensioni del mioCampo del giocatore con quelle del mioCampo avversario
                    //e chiedo all'utente se vuole continuare con queste dimensioni o abbandonare il gioco
                    printf(COLOR_RED"Dimensione campo avversario: %d x %d\n"COLOR_RESET,righe,colonne);
                    termina(socket);
                }

//Da qui inizia il gioco (fase di preparazione)
              else  if(esito_cerca_avversario == 0) {

                    inizializzaCampo(mioCampo);
                    inizializzaCampo(campo_avversario);

                    //Le navi devono occupare il 18% del mioCampo. 18% delle celle
                    celle_occupabili = (int) round(0.18 * (mioCampo.righe * mioCampo.colonne));

//In questo punto vengono scelte e posizionate le navi

                    //La dimensione della nave più grande può essere di massimo 4 celle. Questa dimensione verrà
                    //modificata quando le celle occupabili saranno meno di 4
                    dim_max_nave = 4;

                    do {

                        if (celle_occupabili - contatore_celle_occupate < 4)
                            dim_max_nave = celle_occupabili - contatore_celle_occupate;

                        stampaCampo(mioCampo);
                        printf("\nMenu' navi:\n");
                        stampaMenuNavi(dim_max_nave);

                        printf(COLOR_YELLOW "Attenzione: Per guardare lo stato del tuo campo potresti dover scrollare in alto\n" COLOR_RESET);
                        printf("[Celle libere: %d]\n", celle_occupabili - contatore_celle_occupate);

                        do{

                            printf("Inserisci una nave: ");
                            scanf("%c", &nave_scelta);
                            printf("\n");
                            nave_scelta = tolower(nave_scelta);
                            while (getchar() != '\n');

                        }while((nave_scelta-97 >= dim_max_nave*2) || (nave_scelta-97 < 0) );

                        //Controllo che la nave selezionata sia valida
          /*              if (celleNave(nave_scelta, dim_max_nave) == -1)
                            printf(COLOR_RED "Non esiste la nave %c)!\n" COLOR_RESET, nave_scelta);
*/
              //          else {
                            stampaCampo(mioCampo);

                            printf("Indicare la prima cella in cui si vuole posizionare la nave: ");
                            fgets(posizione_nave, BUFSIZ, stdin);
                            printf("\n");

                            if (str_to_coord(posizione_nave, &coord) != 1)
                                printf(COLOR_RED "Coordinate non valide!\n" COLOR_RESET);

                            else {

                                //Controllo che la nave venga posizionata sul mioCampo
                                if (posizionaNave(mioCampo, coord, versoNave(nave_scelta), celleNave(nave_scelta, dim_max_nave)) == -1)
                                    printf(COLOR_RED "Non è stato possibile posizionare la nave!\n" COLOR_RESET);
                                else {
                                    printf(COLOR_GREEN "Nave posizionata correttamente!\n" COLOR_RESET);
                                    contatore_celle_occupate += celleNave(nave_scelta, dim_max_nave);
                                }
                            }
                  //      }
                    } while (celle_occupabili - contatore_celle_occupate > 0);

                    stampaCampo(mioCampo);

                    printf(COLOR_YELLOW"L'avversario sta posizionando le navi, attendere...\n"COLOR_RESET);

                    finePreparazione(socket);

                    if(attendiPreparazioneAvversario(socket) == 1){

//Qui gioco (scambio delle coordinate per colpire le navi)
                        do{

                            printf("\n\n");

                            if(mioTurno(socket)) {


                                stampaCampo(campo_avversario);
                                printf(COLOR_BLUE ANSI_STYLE_ITALIC"[Stato del campo avversario]\n\n"COLOR_RESET);
                                printf(COLOR_CYAN ANSI_STYLE_BOLD"[*] E' il tuo turno\n"COLOR_RESET);

                                //Ripete il ciclo fin quando l'utente non inserisce delle coordinate valide
                                do{
                                    printf("Coordinate della cella da colpire: ");
                                    fgets(coord_inviate,BUFSIZ,stdin);
                                    printf("\n");

                                } while (str_to_coord(coord_inviate, &coord) == -1);

                                //Nonostante io converta la stringa in coordinate, mando all'avversario la stringa perché
                                //così posso mandarla tramite la socket (str_to_coord funge quindi da controllore per capire
                                //se le coordinare inserite sono giuste)
                                inviaCoordinate(socket, coord_inviate);

                                //Chiamo questo metodo per capire che tipo di cella il giocatore ha colpito
                                stato_avversario_cella = riceviRiscontro(socket);

                                //Prendo il valore della cella colpita associata alla cella
                                //La funzione ritorna il valore negativo associato solo se la cella passata non è già negativo (quindi se non è già colpita o -10)
                                stato_avversario_cella = getCellaColpita(stato_avversario_cella);

                                if(stato_avversario_cella < 0)
                                    aggiornaCampo(campo_avversario, coord, stato_avversario_cella);

                                //Controllo se è stata colpita una cella di una nave, decrementando nel caso il numero di celle occupate dalle navi nel campo avversario
                                if(stato_avversario_cella == -1 || stato_avversario_cella == -2)
                                   campo_avversario.celleOccupate--;

                                stampaCampo(campo_avversario);
                                printf(COLOR_BLUE ANSI_STYLE_ITALIC"[Stato del campo avversario]\n\n"COLOR_RESET);

                            } else{

                                printf(COLOR_BLUE ANSI_STYLE_BOLD "[*] Turno dell'avversario\n"COLOR_RESET);
                                riceviCoordinate(socket, coord_ricevute);

                                str_to_coord(coord_ricevute,&coord);

                                stato_mia_cella = getCella(mioCampo, coord);

                                //Se la cella non esiste invia un -10
                                inviaRiscontro(socket, stato_mia_cella);

                                //Se la cella indicata dall'avversario esiste nel mioCampo
                                if(stato_mia_cella != -10){
                                    stato_mia_cella = getCellaColpita(stato_mia_cella);

                                    //Verifico che la funzione abbia riportato un valore negativo (quindi è stato colpito: -3,-2,-1)
                                    if(stato_mia_cella < 0)
                                        aggiornaCampo(mioCampo, coord, stato_mia_cella);

                                    if(stato_mia_cella == -1 || stato_mia_cella == -2)
                                        mioCampo.celleOccupate--;

                                }

                                stampaCampo(mioCampo);
                                printf(COLOR_CYAN ANSI_STYLE_ITALIC"[Stato del tuo campo]\n\n"COLOR_RESET);
                            }

                            //Se i due campi hanno ancora qualche nave, allora mando il segnale al server
                            //per continuare la partita
                            if(mioCampo.celleOccupate > 0 && campo_avversario.celleOccupate > 0)
                                continuaPartita(socket);

                        } while (mioCampo.celleOccupate > 0 && campo_avversario.celleOccupate > 0);
                    }

                    finePartita(socket);

                    if(mioCampo.celleOccupate==0)
                        verifica_vincitore = verificaVittoria(socket, 2);
                    else
                        verifica_vincitore = verificaVittoria(socket, 1);

                    if(verifica_vincitore == 1){

                        if(mioCampo.celleOccupate>0)
                            schermataVittoria();
                        else
                            schermataSconfitta();

                    }
                    else
                        printf(COLOR_YELLOW"Partita non valida, dati alterati!\n"COLOR_RESET);

                    termina(socket);
                }
        }
    }

}

 void eliminaN(char* str){

    int i = 0;

    while(str[i]!='\0' && str[i]!='\n')
        i++;

    if(str[i]=='\n')
        str[i]='\0';
}
 void strLowerCase(char* str){
    int i=0;

    while(str[i]!='\0'){
        str[i] = tolower(str[i]);
        i++;
    }
}

