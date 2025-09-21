enum verso{vuota_colpita=-3, orizzontale_colpita=-2, verticale_colpita=-1, verticale = 1, orizzontale=2};
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

extern int connessione(const char *ip,const int porta);
//Per trovare un'avversario, i due sfidanti devono avere lo stesso pin e la stessa dimensione del tabellone
extern int cercaAvversario(const int socket, const char* pin, campo mioCampo);

//Funzioni del gioco
extern void schermataIniziale();
extern int** creaCampo(const int righe, const int colonne);
extern void stampaCampo(const campo campo);
extern void inizializzaCampo(const campo campo);
extern void stampaMenuNavi(const int navi_disponibili); //Set di nave disponibili (ogni set ha 2 navi, una verticale e una orizzontale)
extern int posizionaNave(campo campo,const coordinate coord, const int verso, const int celle_nave);
extern void deallocaCampo(campo campo);
extern int righeCampoAvversario(const int socket);
extern int colonneCampoAvversario(const int socket);
extern int str_to_coord(const char* str, coordinate* coord);
//Prende in input una lettera e restituisce il valore del numero di celle che occupa la nave
//Prende in input anche il valore della nave più grande utilizzabile nel gioco
extern int celleNave(const char c,const  int max_nave);
extern int versoNave(const char nave);
//Segnala al server che il giocatore ha finito di posizionare le navi
extern void finePreparazione(const int socket);
//Attende un "segnale" dal server per indicare al giocatore che l'avversario ha posizionato tutte le navi
extern int attendiPreparazioneAvversario(const int socket);
//Ritorna 1 se è il turno del giocatore, 0 se è il turno dell'avversario
extern int mioTurno(const int socket);
extern void inviaCoordinate(const int socket, const char* coord);
extern void riceviCoordinate(const int socket, char* str);
//Riceve lo stato della cella colpita (-3,-2,-1,0,1,2)
extern int riceviRiscontro(const int socket);
extern void inviaRiscontro(const int socket, const int n);
//Restituisce lo stato di una cella. Se la cella non è presente nel campo ritorna -10 (non 0 dato che è un possibile stato)
extern int getCella(const campo campo, const coordinate coord);
//Ritorna il valore della cella colpita associata alla cella normale
extern int getCellaColpita(const int tipoCella);
//Modifica lo stato del campo "colpendo" la cella indicata con il tipo di colpo (-3,-2,-1)
extern void aggiornaCampo(campo campo, const coordinate coord, const int tipoColpo);
extern void continuaPartita(const int socket);
extern void finePartita(const int socket);
extern int verificaVittoria(const int socket, const int vincitore);
extern void termina(const int socket);
extern void schermataSconfitta();
extern void schermataVittoria();