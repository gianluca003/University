import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
public class ServerBattagliaNavale {

    private List<PreSessione> attesaSessioni = new LinkedList<>() ;
    private List<SessioneBattagliaNavale> sessioni = new LinkedList<>();

    private int porta;

    public ServerBattagliaNavale(int porta){
     this.porta=porta;
    }

    public void startSever(){

        ServerSocket server;
        PrintWriter out;
        BufferedReader in;
        String pin;
        String s_righe, s_colonne;
        int righe,colonne;
        PreSessione sessioneInAttesa;

        try {
            
            server = new ServerSocket(porta);

            while (true){

                System.out.println("In attesa di connessioni...");
                Socket socket = server.accept();
                System.out.println("Connesso!");
                Campo campo;

                eliminaSessioniTerminate();

                //Canale di comunicazione solo con l'ultima connessione. Ogni PreSessione e Sessione manterranno
                //la socket inerente al client memorizzata all'interno dell'oggetto
                out = new PrintWriter(socket.getOutputStream(),true);
                in = new BufferedReader(new InputStreamReader(socket.getInputStream()));

                //Prendo i 3 parametri passati dall'utente
                pin = in.readLine();
                s_righe = in.readLine();
                s_colonne = in.readLine();

                if(giocoAvviato(pin))
                    out.println("-1");

                if(pin!=null){

                    righe= Integer.parseInt(s_righe);
                    colonne=Integer.parseInt(s_colonne);

                    sessioneInAttesa = cercaPreSessione(pin);

                    //Se non esiste una sessione già avviata con quel pin, il giocatore viene messo
                    //nella lista di attesa (viene aperta la sessione)
                    if(sessioneInAttesa == null) {
                        apriSessione(new Giocatore(new Campo(righe, colonne)), pin,socket);
                    }
                    else{
                        //Controllo che le dimensioni del campo siano uguali
                        if (sessioneInAttesa.getGiocatoreInAttesa().getCampo().getRighe()!=righe &&
                                sessioneInAttesa.getGiocatoreInAttesa().getCampo().getRighe()!=colonne){
                            out.println("1");
                            out.println(""+sessioneInAttesa.getGiocatoreInAttesa().getCampo().getRighe());
                            out.println(""+sessioneInAttesa.getGiocatoreInAttesa().getCampo().getColonne());
                        }
                        else{
                            out.println("0");
                            sessioneInAttesa.getComunicazione().invia("0");
                            avviaGioco(new Giocatore(new Campo(righe,colonne)),sessioneInAttesa,socket);
                        }
                    }

                }

            }

        } catch (IOException e) {
            System.err.println("Errore durante la creazione del Server");
            e.printStackTrace();
        }

    }

    private PreSessione cercaPreSessione(String pin){

        PreSessione sessioneCercata = null;
        Iterator<PreSessione> iter;
        iter = attesaSessioni.iterator();

        while (iter.hasNext() && !(sessioneCercata=iter.next()).getPin().equals(pin));

        if(sessioneCercata!=null && sessioneCercata.getPin().equals(pin))
            return sessioneCercata;

        return null;
    }

    private boolean giocoAvviato(String pin){
        SessioneBattagliaNavale  sessioneCercata = null;
        Iterator<SessioneBattagliaNavale> iter;
        iter = sessioni.iterator();

        while (iter.hasNext() && !(sessioneCercata=iter.next()).getPin().equals(pin));

        if(sessioneCercata!=null && sessioneCercata.getPin().equals(pin))
            return true;

        return false;
    }

    private void apriSessione(Giocatore giocatore, String pin, Socket socket){
        try {
            attesaSessioni.add(new PreSessione(giocatore,pin,socket));
        } catch (IOException e) {
            System.err.println("Errore durante l'apertura della sessione");
        }
    }

    private void avviaGioco(Giocatore giocatoreDue, PreSessione preSessione, Socket socket){
        SessioneBattagliaNavale sessione = null;

        try {
            sessione = new SessioneBattagliaNavale(preSessione, giocatoreDue, socket);

        } catch (IOException e) {
            System.err.println("Errore durante l'avvio della partita");
            e.printStackTrace();
        }

       if(sessione!=null){
           sessione.start();
           sessioni.add(sessione);
           attesaSessioni.remove(preSessione);
       }


    }

    private void eliminaSessioniTerminate(){
        for(SessioneBattagliaNavale s : sessioni){
            if( s.getTermine() || !s.isAlive())
                sessioni.remove(s);
        }
    }
}

