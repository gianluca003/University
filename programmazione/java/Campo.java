import static java.lang.Math.round;

public class Campo {

    private int righe;
    private int colonne;

    private int celleRimaste;

    public Campo(int righe, int colonne){
        this.righe = righe;
        this.colonne = colonne;
        celleRimaste = (int) round(0.18 * (righe * colonne));
    }

    public int getRighe(){
        return righe;
    }

    public int getColonne(){
        return colonne;
    }

    public void colpito(){
        celleRimaste--;
    }

    public int getCelleRimaste(){
        return celleRimaste;
    }

}
