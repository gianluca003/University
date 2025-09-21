import java.io.IOException;
import java.net.Socket;

public class PreSessione {

    private Giocatore giocatoreUno;
    private final String pin;
    private Comunicazione comunicazione;
    //Memorizzo la socket inerente alla connessione per non perderla quando il client si connette con gli altri client

    public PreSessione (Giocatore giocatore, String pin, Socket socket) throws IOException {
        this.pin=pin;
        giocatoreUno = giocatore;
        comunicazione = new Comunicazione(socket);
    }

    public Giocatore getGiocatoreInAttesa(){
        return giocatoreUno;
    }

    public String getPin(){
        return pin;
    }

    public Comunicazione getComunicazione(){
        return comunicazione;
    }
}
