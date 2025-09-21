import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

public class SessioneBattagliaNavale extends Thread{

    static int partiteGiocate = 0;
    private Giocatore giocatoreUno;
    private Giocatore giocatoreDue;
    private final String pin;
    private boolean turnoGiocatoreUno; //Se true giocatore 1 se false giocatore 2
    private Comunicazione comunicazioneUno;
    private Comunicazione comunicazioneDue;

    private boolean termine = false;


    public SessioneBattagliaNavale(PreSessione preSessione, Giocatore giocatoreDue, Socket socket) throws IOException {
        this.giocatoreUno = preSessione.getGiocatoreInAttesa(); 
        this.giocatoreDue = giocatoreDue;
        this.pin=preSessione.getPin();
        comunicazioneUno = preSessione.getComunicazione();
        comunicazioneDue = new Comunicazione(socket);
        turnoGiocatoreUno = Math.random()%2==0; //Se pari turno giovatore 1, altrimenti turno giocatore 2
        partiteGiocate++;
    }

    public void run() {

        System.out.println("Partita numero "+partiteGiocate+": inizio sessione "+pin);

        //Inserisco le dichiarazioni delle variabili nel try/catch per un problema di scope durante l'utilizzo
        String coordinate = null;
        String inizioUno, fineUno;
        String inizioDue, fineDue;
        String riscontro; //Valore della cella
        String validazioneUno, validazioneDue, validita;

        try {

            //Attende la fine della preparazione dei due giocatori
            inizioUno = comunicazioneUno.leggi();
            inizioDue = comunicazioneDue.leggi();

            //Avvisiamo i client che inizia il gioco (in questo modo "rispondiamo" alla funzione
            // attendiPreparazioneAvversario() del client)
            comunicazioneUno.invia("READY");
            comunicazioneDue.invia("READY");

            if( (inizioUno!=null && inizioDue!=null) && (inizioUno.equals("READY") && inizioDue.equals("READY"))){

                do{
                    if(turnoGiocatoreUno) {

                        //Per prima cosa invia un 1 per dire al giocatore che è il suo turno
                        //(Questo è il punto in cui è in esecuzione la funzione mioTurno() nel client)
                        comunicazioneUno.invia("1");
                        comunicazioneDue.invia("0");

                        coordinate = comunicazioneUno.leggi();

                        comunicazioneDue.invia(coordinate);
                        //Attendo il riscontro della cella colpita
                        riscontro = comunicazioneDue.leggi();

                        if(riscontro.equals("1") || riscontro.equals("2"))
                            giocatoreDue.getCampo().colpito();

                        //Invio il riscontro al giocatoreUno (quello che ha mandato le coordinate)
                        comunicazioneUno.invia(riscontro);
                    } else{
                        comunicazioneDue.invia("1"); //Diamo il turno al giocatore 2
                        comunicazioneUno.invia("0");

                        coordinate = comunicazioneDue.leggi();

                        comunicazioneUno.invia(coordinate);
                        riscontro = comunicazioneUno.leggi();

                        if(riscontro.equals("1") || riscontro.equals("2"))
                            giocatoreUno.getCampo().colpito();

                        comunicazioneDue.invia(riscontro);
                    }

                    fineUno = comunicazioneUno.leggi();
                    fineDue = comunicazioneDue.leggi();

                    //Cambio turno
                    turnoGiocatoreUno=!turnoGiocatoreUno;

                }while(fineUno.equals("CONTINUE") && fineDue.equals("CONTINUE"));

                validazioneUno = comunicazioneUno.leggi();
                validazioneDue = comunicazioneDue.leggi();

                if(validazioneUno!=null && validazioneDue!=null){
                if( (validazioneUno.equals("ME") && validazioneDue.equals("AV") && giocatoreDue.getCampo().getCelleRimaste()==0)
                || (validazioneUno.equals("AV") && validazioneDue.equals("ME") && giocatoreUno.getCampo().getCelleRimaste()==0 ))
                    validita = "VALID";
                else
                    validita = "INVALID";

                comunicazioneUno.invia(validita);
                comunicazioneDue.invia(validita);
                }
            }

            comunicazioneUno.chiudiComunicazione();
            comunicazioneDue.chiudiComunicazione();

        } catch (IOException e) {
            System.err.println("Errore nella lettura delle coordinate");
            e.printStackTrace();
        }
        finally {
           comunicazioneUno.chiudiComunicazione();
           comunicazioneDue.chiudiComunicazione();
        }

        termine=true;
        this.interrupt();
    }

    public String getPin(){
        return pin;
    }

    public boolean getTermine(){return  termine;}
}
