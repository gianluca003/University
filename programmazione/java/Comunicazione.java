import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

public class Comunicazione {

    private PrintWriter out;
    private BufferedReader in;

    private final Socket socket;

    public Comunicazione(Socket socket) throws IOException {
        in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
        out = new PrintWriter(socket.getOutputStream(),true);
        this.socket = socket;
    }

    public String leggi() throws IOException {
        return in.readLine();
    }

    public void invia(String str){
        out.println(str);
    }

    public void chiudiComunicazione(){
        try {
            socket.close();
        } catch (IOException e) {
            System.err.println("Errore durante la chiusura della comunicazione");
            e.printStackTrace();
        }

    }

}
