const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

//Marvel
const public_key = "50eb9252d36e716a146ca7d60b99394f";
const private_key = "c98fbc887d37570aac70515646c7c003f3e99ef4";
const ts = Date.now();
const hashed_key = crypto.createHash('md5').update(ts+private_key+public_key).digest("hex");
let total_album_cards;

//Server
const app = express();
const port = 3000;

//DB
const db_uri =  "mongodb+srv://gianlucacalderonrivera:admin@cluster0.6nj7gin.mongodb.net/";
const db_name = "superheros_album";
const client_to_db = new MongoClient(db_uri);

app.use(express.json());
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, "0.0.0.0", ()=>{
    console.log(`Server in ascolto sulla porta: ${port}`);

    /*
     **** SCRIPT PER PRENDERE IL NUMERO TOTALE DI CARTE DALL'OFFSET 0 A 1000 ESCLUDENDO QUELLE SENZA IMMAGINI  
            (mettere la funzione in async per l'await del fetch)
         total_album_cards = 0;

      for(let i=60; i<1000; i=i+20){
        await fetch(`https://gateway.marvel.com:443/v1/public/characters?ts=${ts}&apikey=${public_key}&hash=${hashed_key}&offset=${i}&orderBy=-modified`)
        .then(response => response.json())
        .then(res => {
                        res.data.results.forEach(element => {
                            if(!element.thumbnail.path.includes("image_not_available")){
                                total_album_cards++;  
                                console.log("offset: "+i+" card: "+total_album_cards);
                            }
                        });
        });
    }
    console.log("totale:: "+total_album_cards);
    */

    //Non eseguo ogni volta i calcoli a causa delle lunghe attese delle api marvel. 
    //L'ultimo calcolo effettuato ha restituito 759 carte valide (con delle immagini)
    total_album_cards = 759;
})

//Questi middleware controllano solo la correttezza dell'uid, non altri tipi di id (come i packet id)

//Middleware usata per le funzionalià eseguibili solo dall'admin 
//Quando uso le funzionalità che richiedono questo middleware posso avere l'uid nel body o nelle query dell'url
async function authAdmin(req,res,next){
    
    let id_body = req.body.uid; 
    let id_query = req.query.admin; 
    let id_param = req.params.uid;
    let id;
    let admin;
    const checkUid = /^[a-f0-9]{24}$/;
    const client = await client_to_db.connect();
  
    if(checkUid.test(id_body))
        id=id_body;

    else if(checkUid.test(id_query))
        id=id_query;

    else if(checkUid.test(id_param))
        id=id_param;

    if(id!=null && id!=undefined && checkUid.test(id)){
        try{
            admin = await client.db(db_name).collection("Admin").findOne({_id: ObjectId.createFromHexString(id)});
       }
       catch (e) {
               res.status(500).json(`DB Error: ${e.code}`); 
          
       } finally {
           await client.close();
       }
    }

    if(admin!=null && admin!=undefined)
        next();
     else
        res.status(401).json({"admin":false,"msg":["Unauthorized access"]});
}

//Middleware usata per le funzionalià eseguibili solo da un utente base loggato
async function authUser(req,res,next){

    let id_body = req.body.uid; 
    let id_query = req.query.user; 
    let id_param = req.params.uid;
    let id;
    let user;
    const checkUid = /^[a-f0-9]{24}$/;
    const client = await client_to_db.connect();
 
    if(checkUid.test(id_body))
        id=id_body;

    else if(checkUid.test(id_query))
        id=id_query;

    else if(checkUid.test(id_param))
        id=id_param;


    if(checkUid.test(id)){
        try{
            user = await client.db(db_name).collection("Users").findOne({_id: ObjectId.createFromHexString(id)});
       }
       catch (e) {
               res.status(500).json(`DB Error: ${e.code}`); 
          
       } finally {
           await client.close();
       }
    }

    if(user!=null && user!=undefined)
        next();
     else
        res.status(401).json({"msg":["Access denied"],"error":true});
}

//Middleare usata per le funzionalità che possono svolgere tutti gli utente loggati (sia admin che utenti base)
//Quando uso le funzionalità che richiedono questo middleware posso avere l'uid nel body, nelle query dell'url o nei parametri
async function auth(req,res,next){
    let id_body = req.body.uid; 
    let id_query = req.query.user; 
    let id_param = req.params.uid;
    let id;
    let user;
    let admin;
    const checkUid = /^[a-f0-9]{24}$/;
    const client = await client_to_db.connect();

    if(checkUid.test(id_body))
        id=id_body;

    else if(checkUid.test(id_query))
        id=id_query;

    else if(checkUid.test(id_param))
        id=id_param;

    if(id!=null && id!=undefined && checkUid.test(id)){
        try{
            admin = await client.db(db_name).collection("Admin").findOne({_id: ObjectId.createFromHexString(id)});
            user = await client.db(db_name).collection("Users").findOne({_id: ObjectId.createFromHexString(id)});
       }
       catch (e) {
               res.status(500).json(`DB Error: ${e.code}`); 
          
       } finally {
           await client.close();
       }
    }

    //Controlla se esiste solo uno dei due (Admin o user)
    if(( (admin!=null && admin!=undefined) && (user==null || user==undefined)) || ( (admin==null || admin==undefined) && (user!=null && user!=undefined) ) )
        next();
     else
        res.status(401).json({"msg":["Access denied"],"error":true});
}

//Sign up route
app.post('/user', (req,res)=>{
    signup(req.body, res);   
});

//Invia al client le informazioni inerenti al proprio utente
app.get('/user/:uid',auth,(req,res)=>{
    let uid = req.params.uid;
    getUser(uid,res);
});

//Modifica le informazioni inerenti ad un profilo
app.put('/user',auth,(req,res)=>{
    modifyUser(req.body,res);
});

//Elimina un utente dal db
app.delete('/user/:uid',auth,(req,res)=>{
    let uid=req.params.uid;
    deleteUser(uid,res);
})

//Login route
app.post('/login',(req,res)=>{
    login(req.body,res);
});

//Restituisce tutti i pacchetti in draft (visibili solo all'admin)
//Bisogna passare per forza l'uid dell'admin tramite query dell'url
app.get('/packets/drafts',authAdmin,(req,res)=>{
    getDraftsPackets(res);
});

//Restituisce i dettagli di un singolo pacchetto
//La richiesta si aspetta come parametro l'id di tale pacchetto
app.get('/packets/drafts/:id', authAdmin, (req,res)=>{
    let id = req.params.id;
    getDraftPacket(id,res);
});

//Inserisce un nuovo pacchetto di figurine
app.post('/packets/drafts',authAdmin,(req,res) =>{
    addDraftsPackets(req.body,res);
});

//Aggiorna i campi di un pacchetto in draft
app.put('/packets/drafts',authAdmin,(req,res)=>{
    modifyDraftPacket(req.body,res);
});

//Elimina un pacchetto in draft 
app.delete('/packets/drafts/:id',authAdmin,(req,res)=>{
    let id = req.params.id;
    deleteDraftPacket(id,res);
});

//Restituisce tutti i pacchetti attivi 
app.get('/packets',(req,res)=>{
    getPackets(res);
});

//Prende il pacchetto in draft e lo sposta tra quelli attivi
app.post('/packets',authAdmin,(req,res)=>{
    addPacket(req.body,res);
});

//Elimina il pacchetto dalla collections degli attivi e lo sposta tra quelli in draft
app.delete('/packets/:id',authAdmin,(req,res)=>{
    let id = req.params.id;
    deletePacket(id,res);
});

//Restituisce i post da usare nell'homepage
app.get('/post', (req,res)=>{
    getPosts(res);
})

//Aggiunge un post all'homepage. Funzionalità eseguibile solo dall'admin
//(Per questo motivo uso il middleware authAdmin())
app.put('/post',authAdmin, (req,res)=>{

    if(req.body.image==true)
      changeImage(req.body, res);

    if(req.body.article==true)
        changeArticle(req.body, res)
});

//Restituisce i dettagli della carta di credito di un utente. 
//Il cvv sarà l'unico parametro che non verrà restituito, per motivi di sicurezza
//Questa funzione verrà usata solo dagli utente base
app.get('/payment/:uid',authUser, (req,res)=>{
    let uid = req.params.uid;
    getPaymentInformations(uid,res);
});

//Aggiorna le informazioni inerenti alla carta di credito di un utente
app.put('/payment',authUser,(req,res)=>{
    modifyPaymentSettings(req.body,res);
});

//Restituisce tutti i nomi e gli id degli eroi di marvel
//query nameStartWith e id=false o true. ID indica se se vuole prendere amche l'id di ogni erore o solo la lista dei nomi
app.get('/heros',(req,res)=>{
    getHeros(req,res);
});

//Permette di acquistare un pacchetto di figurine.
// L'id tra i parametri si rifersce all'id del pacchetto. L'uid è l'id dell'utente
app.get('/purchase/:uid/:id',authUser,(req,res)=>{
    let id = req.params.id;
    let uid = req.params.uid;
    purchasePacket(uid,id,res);
});

//Permette di acquistare dei crediti da spendere successivamente
//per acquistare i pacchetti di figurine
app.post('/credits',authUser,(req,res)=>{
    purchaseCredits(req,res);
});

//Prendo le carte di un utente
//Può avere anche dei parametri tra le query, serviranno per i filtri.
//Ad esempio duplicates: restituisce tutte le carte con quantità maggiore di 1
//Tra le query troviamo: filter, offset e hero
app.get('/cards/:uid',authUser, (req,res)=>{
    getPageCards(req,res);
});

//Invio tutte le statistiche delle carte di un album di un determinato utente
app.get('/statistics/:uid',authUser,(req,res)=>{
    let uid = req.params.uid;
    getStatistics(uid,res);
});

//Prendo l'id dell'eroe e prendo le informazioni dalla marvel. Queste informazioni
//sono ottenibili solo se si è un utente, e se si ha la card dell'eroe richiesto
app.get('/details/:hero/:uid',authUser,(req,res)=>{
    getDetails(req,res);
});

//Restituisco le informazioni inerenti ai comics marvel
app.get('/comics/:comicID',(req,res)=>{
    let id = parseInt(req.params.comicID);
    getComics(id,res);
});

//Restituisco le informazioni inerenti alle stories marvel
app.get('/stories/:storiesID',(req,res)=>{
    let id = parseInt(req.params.storiesID);
    getStories(id,res);
});

//Restituisco le informazioni inerenti alle series marvel
app.get('/series/:seriesID',(req,res)=>{
    let id = parseInt(req.params.seriesID);
    getSeries(id,res);
});

//Restituisco le informazioni inerenti all'events marvel
app.get('/events/:eventsID',(req,res)=>{
    let id = parseInt(req.params.eventsID);
    getEvents(id,res);
});

//Restituisce solo le informazioni del db (non della marvel)
//inerenti alle carte che possiede un utente.
//Può avere dei filtri: la rarità o i doppioni. Se non viene specificato nulla restituisce tutte le carte
//A differenza di getCard, questa route restituisce tutte le carte. Questo perché non ci sono grandi problemi 
//di latenza perché non si interagisce con il server marvel. Es. filter=super oppure filter=duplicates ecc.
app.get('/cards/info/:uid',authUser,(req,res)=>{
    getInformationsCards(req,res);
});

//Permette di pubblicare una proposta di scambio
app.post('/trades', authUser, (req,res) =>{
    postTrade(req,res);
});

//Restituisce le proposte di scambio. Restituisce 20 proposte alla volta in base all'offset indicato
//Se non viene indicato l'offset nella query dell'uri, di default resistiusce l'offset 0
//Inoltre si possono applicare dei filtri per prendere i trade chiusi o ancora aperti. ad es: trade=open
app.get('/trades/:uid',authUser,(req,res)=>{
    getTrades(req,res);
}); 

//Restituisce le richieste di scambio create da un'utente
//Posso avere anche dei filtri per ottenere i trade chiusi o aperti es: trade=open
app.get('/trades/myOffers/:uid',authUser,(req,res)=>{
    getUserOffers(req,res);
}); 

//Elimina la proposta di scambio di un utente. L'id si riferisce all'id della proposta (della collection 'Trades')
app.delete('/trades/myOffers/:uid/:id',authUser,(req,res) => {
    deleteOffer(req,res);
});

//Metodo che si occupa di accettare la richiesta di scambio di un utente e procede con "l'affare"
app.post('/trades/deal', authUser, (req,res)=>{
    tradeDeal(req,res);
});

function hash(input){
    return crypto.createHash('sha256').update(input).digest('hex');
}

function saltingPassword(password){
    return "$Up3r_pR0j3c!-H3r@S"+password;
}

async function signup(user, res){

    let valid_input = true; //Se i parametri sono giusti allora la flag rimane true e fa il controllo verso il DB
    let user_exists = false; 
    const checkFirstName = /^[a-z]+ ?[a-z ]*$/i;
    const checkLastName = /^[a-z]+ ?[a-z ]*$/i;
    const checkUsername = /^[a-z0-9_-]{3,15}$/i;
    const checkEmail = 	/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const checkPassword = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    //Prima controllo che i parametri passati rispettino le regole delle regex (controllo fatto anche nel frontend)
    if(!checkFirstName.test(user.firstName)){
        error_msg.msg.push("Invalid name");
        valid_input=false;
    }

    if(!checkLastName.test(user.lastName)){
        error_msg.msg.push("Invalid last name");
        valid_input=false;
    }

    if(!checkUsername.test(user.username)){
        error_msg.msg.push("Invalid username");
        valid_input=false;
    }

    if(!checkEmail.test(user.email)){
        error_msg.msg.push("Invalid email");
        valid_input=false;
    }

    if(!checkPassword.test(user.password)){
        error_msg.msg.push("Invalid password");
        valid_input=false;
    }

    if(valid_input){

        const client = await client_to_db.connect();

        try{
             //Controllo che non ci sia un'email o uno username già presenti nel DB
            if(await client.db(db_name).collection("Users").findOne({username:user.username}) != null){
                error_msg.msg.push(`This username ${user.username} already exists`);
                user_exists=true;
            }

            if(await client.db(db_name).collection("Users").findOne({email:user.email}) != null){
                error_msg.msg.push(`This email ${user.email} already exists`);
                user_exists=true;
            }

            //imposto i crediti = a 0 per sicurezza
            user.credits=0;

            //Prendo l'immagine di profilo prendendo l'url dalle api della marvel
            await fetch(`https://gateway.marvel.com:443/v1/public/characters?name=${user.hero}&ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
            .then(response => response.json())
            .then(res => {

                //Controllo se esiste l'eroe inserito, se si aggiungo l'url nel campo profileImage di user
                if(res.data.total>0)
                    user['profileImage']=res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension;

                else //altrimenti immagine di default
                    user['profileImage']="https://static.vecteezy.com/system/resources/previews/001/840/618/original/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg"

            });
     
            //Se l'email e lo username non esistono già, procedo con la registrazione
            if(user_exists==false){
                user.password = hash(saltingPassword(user.password));
                await client.db(db_name).collection("Users").insertOne(user);
            }
        }
        catch (e) {
            if (e.code == 11000) {

                error_msg.msg.push("This user already exists");
                user_exists=true;

            } else {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json(error_msg); 
            }
           
        } finally {
            await client.close();
        }
    }
   
    if(user_exists || !valid_input)
        res.status(400).json(error_msg); 
    else
        res.status(201).json({'uid':user._id, 'error':false }); 
}

async function login(user, res){

    const checkUsername = /^[a-z0-9_-]{3,15}$/i;
    const checkPassword = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    let valid_input = true; //flag per capire se gli input inseriti sono validi
    let log_user = null; //Variabile in cui verrà inserito l'utente iscritto (nel caso non lo trovasse la variabile conterrà null)
    let admin = null; //Variabile in cui verrà inserito l'admin nel caso l'utente sia un admin
    let error_msg = {error:true, msg:[]};

    //Controllo che i due input passati siano formattati correttamente
    if(!checkUsername.test(user.username)){
        error_msg.msg.push("invalid username");
        valid_input = false;
    }

    if(!checkPassword.test(user.password)){
        error_msg.msg.push("Invalid password");
        valid_input = false;
    }

    if(valid_input){

        const client = await client_to_db.connect();
        user.password = hash(saltingPassword(user.password));

        //Controllo che l'utente sia registrato
        try{
            
            log_user = await client.db(db_name).collection("Users").findOne({username:user.username, password:user.password});

            //Controllo che l'utente sia un admin
            if(log_user == null)
                 admin = await client.db(db_name).collection("Admin").findOne({username:user.username, password:user.password})

            if(log_user == null && admin == null)
                error_msg.msg.push(`Invalid credentials`);
       }
       catch (e) {
               error_msg.msg.push(`DB Error: ${e.code}`);
               res.status(500).json(error_msg); 
          
       } finally {
           await client.close();
       }
    }
    
    if(!valid_input || (log_user==null && admin==null))
        res.status(401).json(error_msg);

    else if(admin!=null)
        res.status(200).json({"uid":admin._id, "admin":true});

    else
        res.status(200).json({"uid":log_user._id, "admin":false});
    //Nonostrante sopra passo un campo boolean admin, e quindi sarebbe facilmente 'spoofabile', 
    //una volta all'interno della pagina admin parte una fetch per verifica se l'uid appartiene  effettivamente 
    //ad un admin o no. Una volta verificato cio' allora verranno mostrati i dati inerenti all'admin.
    // Questo campo lo uso solo  per avere un indicatore di quando far partire la pagina admin o no
}

async function getUser(uid,res){

    let user = null;
    let admin = null;
    let totalCards = 0;

        const client = await client_to_db.connect();

             //Controllo che ci sia un utente nella collections user, se non lo dovessi trovare, procedo con la query
             //nelle collections degli admin
        try{

            user = await client.db(db_name).collection("Users").findOne({_id:ObjectId.createFromHexString(uid)});

            if(user==null || user==undefined)
                admin = await client.db(db_name).collection("Admin").findOne({_id:ObjectId.createFromHexString(uid)});
            else{
                //Se si tratta di un utente normale, procedo a prendere il numero di carte che possiede
                totalCards = await client.db(db_name).collection("Cards").countDocuments({user:uid});
                user['totalCards']=totalCards;
                user['maxTotalCards']=total_album_cards;
            }
       }
       catch (e) {
               error_msg.msg.push(`DB Error: ${e.code}`);
               res.status(500).json({error_msg}); 
          
       } finally {
           await client.close();
       }   

    //Nonostante si possa dare per scontato che un utente esista (perché se si arriva in questa funzione, significa
    //che i controlli del middleware auth sono stati superati), preferisco fare un piccolo controllo
    //se l'utente esista oppure no. Questo perché in uno scenario teorico di grande dimensioni, un db potrebbe
    //aver cancellato (o a ver fatto altre operazioni) un utente proprio nell'istante che intercorre tra la fine del middleware
    //e l'inizio della funzione getUser()
    if(user!=null && user!=undefined)
        res.status(200).json({user,"error":false});

    else if (admin!=null && admin!=undefined){

         //Cambio nome della da admin in user in modo tale da avere nel frontend la stessa key 
         //sia per gli utenti base che per gli admin
        user = admin;

        res.status(200).json({user,"error":false});
    }

    else
        res.status(401).json({"msg":"This user doesn't exists", "error":true});
}

async function modifyUser(modify,res){

    const checkFirstName = /^[a-z]+ ?[a-z ]*$/i;
    const checkLastName = /^[a-z]+ ?[a-z ]*$/i;
    const checkUsername = /^[a-z0-9_-]{3,15}$/i;
    const checkEmail = 	/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const checkPassword = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    let user_exists;
    let admin_exists;
    let email_exists = null; //Setto email e username exists a null perché nel caso un utente non volesse
    let username_exists = null; //cambiare questi due parametri, il loro valore sarà già null
    let valid_user = false; //Conterrà una flag per capire se l'utente rispetta tutte le condizioni di esistenza
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client
    let valid_input = true;

    //In questa funzione non controllo la correttezza dell'uid perché il controllo viene già fatto nel middleware auth

    if(modify.user.hasOwnProperty('firstName')){
        if(!checkFirstName.test(modify.user.firstName)){
            error_msg.msg.push("Invalid first name");
            valid_input = false;
        }
    }

    if(modify.user.hasOwnProperty('lastName')){
        if(!checkLastName.test(modify.user.lastName)){
            error_msg.msg.push("Invalid last name");
            valid_input = false;
        }
    }

    if(modify.user.hasOwnProperty('username')){
        if(!checkUsername.test(modify.user.username)){
            error_msg.msg.push("Invalid username");
            valid_input = false;
        }
    }

    if(modify.user.hasOwnProperty('email')){
        if(!checkEmail.test(modify.user.email)){
            error_msg.msg.push("Invalid email");
            valid_input = false;
        }
    }

    if(modify.user.hasOwnProperty('password')){
        if(!checkPassword.test(modify.user.password)){
            error_msg.msg.push("Invalid password");
            valid_input = false;
        }
    }

    if(valid_input){

        const client = await client_to_db.connect();

        //Controllo che ci sia un utente nella collections, se non lo dovessi trovare, procedo con la query
        //nelle collections degli admin. Mi serve per capire quali tipo di user ha fatto la richiesta
        try{

            user_exists = await client.db(db_name).collection("Users").findOne({_id:ObjectId.createFromHexString(modify.uid)});

           
            if(user_exists!=null && user_exists!=undefined){

                //Se si desidera modificare la password, bisogna fare l'hash della password (e il salting)
                if(modify.user.hasOwnProperty("password"))
                    modify.user.password = hash(saltingPassword(modify.user.password));
            

                //Nel caso volessi cambiare username e/o email, controllo che non sia già presente nella collection
                if(modify.user.hasOwnProperty("email")){
                    email_exists = await client.db(db_name).collection("Users").findOne({email:modify.user.email});

                    if(email_exists!=null || email_exists!=undefined)
                        error_msg.msg.push(`This email ${modify.user.email} already exists`);
                }

                if(modify.user.hasOwnProperty("username")){
                    username_exists = await client.db(db_name).collection("Users").findOne({username:modify.user.username})

                    if(username_exists!=null || username_exists!=undefined)
                        error_msg.msg.push(`This username ${modify.user.username} already exists`);
                }

                //Nel caso si volesse cambiare eroe, bisogna aggiornare anche l'immagine
                if(modify.user.hasOwnProperty("hero")){

                    await fetch(`https://gateway.marvel.com:443/v1/public/characters?name=${modify.user.hero}&ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
                    .then(response => response.json())
                    .then(res => {
        
                        //Controllo se esiste l'eroe inserito, se si aggiungo l'url nel campo profileImage di user
                        if(res.data.total>0)
                            modify.user['profileImage']=res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension;
        
                        else //altrimenti immagine di default
                            modify.user['profileImage']="https://static.vecteezy.com/system/resources/previews/001/840/618/original/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg"
        
                    });

                }
                
                
                //Se username e email non sono già presenti nella collections, allora provvedo a modificare i parametri
                //Nel caso volessi cambiarea altri parametri che non siano username e email, i due parametri
                //sono già inizializzati a null
                if((username_exists==null || username_exists==undefined) && (email_exists==null || email_exists==undefined))
                    await client.db(db_name).collection("Users").updateOne({_id:ObjectId.createFromHexString(modify.uid)},{$set:modify.user});


            } else{
                //Procedo a cercare l'utente admin tra le collections degli admin se non è stato trovato tra gli users
                admin_exists = await client.db(db_name).collection("Admin").findOne({_id:ObjectId.createFromHexString(modify.uid)});

                if(admin_exists!=null && admin_exists!=undefined){

                    //Se si desidera modificare la password, bisogna fare l'hash della password (e il salting)
                     if(modify.user.hasOwnProperty("password"))
                         modify.user.password = hash(saltingPassword(modify.user.password));

                    //Nel caso volessi cambiare username e/o email, controllo che non sia già presente nella collection
                    if(modify.user.hasOwnProperty("email")){
                        email_exists = await client.db(db_name).collection("Admin").findOne({email:modify.user.email});

                        if(email_exists!=null || email_exists!=undefined)
                            error_msg.msg.push(`This email ${modify.user.email} already exists`);
                    }

                    if(modify.user.hasOwnProperty("username")){
                        username_exists = await client.db(db_name).collection("Admin").findOne({username:modify.user.username})

                        if(username_exists!=null || username_exists!=undefined)
                            error_msg.msg.push(`This username ${modify.user.username} already exists`);
                    }

                //Se username e email non sono già presenti nella collections, allora provvedo a modificare i parametri
                //Nel caso volessi cambiarea altri parametri che non siano username e email, i due parametri
                //sono già inizializzati a null
                if((username_exists==null || username_exists==undefined) && (email_exists==null || email_exists==undefined))
                    await client.db(db_name).collection("Admin").updateOne({_id:ObjectId.createFromHexString(modify.uid)},{$set:modify.user});
                }
                   
            }
        }
        catch (e) {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json({error_msg}); 
            
        } finally {
            await client.close();
        }   
    }

    //Prima controllo che l'input sia valido e che l'utente (base o admin) esista
    //Successivamente controllo se username e email non sono univoci (quindi uguali a null o undefined)
    if(((admin_exists==null || admin_exists==undefined) && user_exists!=null && user_exists!=undefined) || ( (admin_exists!=null && admin_exists!=undefined) && (user_exists==null || user_exists==null) ) )
        if((username_exists==null || username_exists==undefined) && (email_exists==null || email_exists==undefined))
            valid_user = true;

    if(!valid_input || !valid_user)
        res.status(400).json(error_msg);
    else
        res.status(200).json({'error':false});

}

async function deleteUser(uid,res){

    const client = await client_to_db.connect();

    try{
            await  client.db(db_name).collection("Users").deleteOne({_id:ObjectId.createFromHexString(uid)});
            await  client.db(db_name).collection("Cards").deleteMany({user:uid});
            await  client.db(db_name).collection("Trades").deleteMany({"seller.id": uid});
   }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
   } finally {
       await client.close();
   }

   res.status(200).json({'error':false});

}

async function getDraftPacket(id,res){

    const checkID = /^[a-f0-9]{24}$/;
    let packet;
    let error_msg = {error:true, msg:[]};

    //Ricontrollo l'ID per un controllo ulteriore, nonostante già ci siano i dovuti controlli nel middleware authAdmin
    if(!checkID.test(id)){

        res.status(400).json({"msg":"Invalid id"});

    } else{

        const client = await client_to_db.connect();

             //Controllo che ci sia il pacchetto
        try{

            packet = await client.db(db_name).collection("Drafts_packets").findOne({_id:ObjectId.createFromHexString(id)});
       }
       catch (e) {
               error_msg.msg.push(`DB Error: ${e.code}`);
               res.status(500).json(error_msg); 
          
       } finally {
           await client.close();
       }   
    }

    if(packet==null || packet==undefined)
        res.status(401).json({"msg":"This packet doesn't exists"});
    else
        res.status(200).json(packet);
}

async function getDraftsPackets(res){
    let packets;
    const client = await client_to_db.connect();
    let error_msg = {error:true, msg:[]};

    try{
        
        //Prendo tutti i pacchetti
        packets = await client.db(db_name).collection("Drafts_packets").find().toArray();
   }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
      
   } finally {
       await client.close();
   }

   res.status(200).json(packets);
}

async function addDraftsPackets(packet,res){

    let valid_input = true; //Se i parametri sono giusti allora la flag rimane true e fa il controllo verso il DB
    const checkTitle = /^[a-z][a-z1-9:,-.\'!_ ]+$/i;
    const checkDescription = /^[a-z1-9][a-z1-9"€$'-_%()èùàòì+/*£!ç@:;,. ]*$/i;
    let packetTitle_exists = false; //Flag per capire se esiste già un pacchetto con lo stesso titolo
    let totalCards_type; //Contiene il valore della somma di tutti i tipi delle carte
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    delete packet.uid;

    if(!checkTitle.test(packet.title)){
        error_msg.msg.push("Invalid title");
        valid_input = false;
    }

    if(!checkDescription.test(packet.description)){
        error_msg.msg.push("Invalid description");
        valid_input = false;
    }

    if(packet.cost<1){
        error_msg.msg.push("Invalid cost");
        valid_input = false;
    }

    if(packet.totalCards<1){
        error_msg.msg.push("Invalid total cards");
        valid_input = false;
    }

    totalCards_type = parseInt(packet.cards.legendaries) + parseInt(packet.cards.heroics) + parseInt(packet.cards.mythics) + parseInt(packet.cards.super) + parseInt(packet.cards.commons);

    if(((parseInt(packet.totalCards) > parseInt(totalCards_type)) && packet.random == false) || (parseInt(packet.totalCards)<parseInt(totalCards_type))){
        error_msg.msg.push("Invalid cards quantity");
        valid_input = false;
    }

    if(valid_input){

        const client = await client_to_db.connect();

        try{
             
            //Controllo che non ci sia un pacchetto con lo stesso titolo
            if(await client.db(db_name).collection("Drafts_packets").findOne({title:packet.title}) != null){
                error_msg.msg.push(`This title ${packet.title} already exists`);
                packetTitle_exists=true;
            }

            if(!packetTitle_exists){
                await client.db(db_name).collection("Drafts_packets").insertOne(packet);
            }
        }
        catch (e) {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json(error_msg); 
        } finally {
            await client.close();
        }
    }

    if(packetTitle_exists || !valid_input)
        res.status(400).json(error_msg);
        
    else
        res.status(202).json({'error':false});
    
}

async function modifyDraftPacket(modify,res){
    const checkID = /^[a-f0-9]{24}$/;
    let valid_input = true;
    let packet_id = modify.packet.id
    const checkTitle = /^[a-z][a-z1-9:,-.!\'_ ]+$/i;
    const checkDescription = /^[a-z1-9][a-z1-9"€$'-_%()èùàòì+/*£!ç@:;,. ]*$/i;
    let totalCards_type;
    let packet_exists;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client
    
    //Elimino il campo id per non creare problemi nel momento in cui inseriro il json modify.packet per aggiornare i dati
    delete modify.packet.id;

    if(!checkID.test(packet_id)){
        error_msg.msg.push("Invalid packet's ID");
        valid_input = false;
    }

    //Controllo quali attributi dell'oggetto sono presenti per poi fare gli opportuni controlli
    if(modify.packet.hasOwnProperty('title')){
        if(!checkTitle.test(modify.packet.title)){
            error_msg.msg.push("Invalid title");
            valid_input = false;
        }
    }

    if(modify.packet.hasOwnProperty('description')){
        if(!checkDescription.test(modify.packet.description)){
            error_msg.msg.push("Invalid title");
            valid_input = false;
        }
    }

    if(modify.packet.hasOwnProperty('cost')){
        if(modify.packet.cost<1){
            error_msg.msg.push("Invalid cost");
            valid_input = false;
        }
    }

    if(modify.packet.hasOwnProperty('totalCards')){
        if(modify.totalCards<1){
            error_msg.msg.push("Invalid total cards");
            valid_input = false;
        }

        //Questo controllo viene fatto solo se si ha il campo totalCards e random
        if(modify.packet.hasOwnProperty('random')){
            totalCards_type = parseInt(modify.packet.legendaries) + parseInt(modify.packet.heroics) + parseInt(modify.packet.mythics) + parseInt(modify.packet.super) + parseInt(modify.packet.commons);

            if(((parseInt(modify.packet.totalCards) > parseInt(totalCards_type)) && modify.packet.random == false) || (parseInt(modify.packet.totalCards)<parseInt(totalCards_type))){
                error_msg.msg.push("Invalid cards quantity");
                valid_input = false;
            }
        }
    }

   if(valid_input){
        const client = await client_to_db.connect();

        try{

            //Controllo se esiste il pacchetto 
        packet_exists = await client.db(db_name).collection("Drafts_packets").findOne({_id:ObjectId.createFromHexString(packet_id)});
        
        if(packet_exists!=null && packet_exists!=undefined){

            //Il metodo updateOne di mongoDB non permette di aggiornare un singolo campo di un sotto-oggetto (come nel caso di cards).
            //aggiorna il sotto-oggetto eliminando tutti i campi non presenti all'interno del nuovo oggetto, alterando la struttura dei 
            //document. Per questo motivo prendo i campi di cards già esistenti, copio solo quelli non modificati dall'utente, e invio la query
            //con i vecchi dati di cards + quelli nuovi. Questa logica si applica solo con i sotto-oggetti. (nel nostro caso solo con cards)
                if(modify.packet.hasOwnProperty('cards')){
                    
                    Object.keys(packet_exists.cards).forEach( key => {
                        if(!modify.packet.cards.hasOwnProperty(key))
                            modify.packet.cards[key]=packet_exists.cards[key];
                    });
                }

            await client.db(db_name).collection("Drafts_packets").updateOne({_id:ObjectId.createFromHexString(packet_id)},{$set:modify.packet});
        
            } else{
                error_msg.msg.push("This packet doesn't exists");
            }

    }
    catch (e) {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json(error_msg);  
        
    } finally {
        await client.close();
        }
   }

    if(packet_exists==null || packet_exists==undefined || !valid_input)
        res.status(400).json(error_msg); 
    else
        res.status(201).json({'error':false }); 
}

async function deleteDraftPacket(id,res){

    const checkID = /^[a-f0-9]{24}$/;
    let valid_input = true;
    let packet_exists = null;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    if(!checkID.test(id)){
        error_msg.msg.push("Invalid packet's ID");
        valid_input = false;
    }

    const client = await client_to_db.connect();

    try{

        if(valid_input){
              //Controllo se il pacchetto esiste
            packet_exists = await client.db(db_name).collection("Drafts_packets").findOne({_id:ObjectId.createFromHexString(id)});
        
            if(packet_exists!=null && packet_exists!=undefined)
                await client.db(db_name).collection("Drafts_packets").deleteOne({_id:ObjectId.createFromHexString(id)});

            else
                error_msg.msg.push("This packet's ID doesn't exists");
        }
      
   }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
      
   } finally {
       await client.close();
   }

   if(packet_exists==null || packet_exists==undefined || !valid_input)
         res.status(400).json(error_msg); 
   else
         res.status(200).json({'error':false }); 

}

async function getPackets(res){

    let packets;
    const client = await client_to_db.connect();

    try{
        
        //Prendo tutti i pacchetti
        packets = await client.db(db_name).collection("Packets").find().toArray();
   }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
      
   } finally {
       await client.close();
   }

   res.status(200).json(packets);
}

async function addPacket(packet,res){

    let valid_input = true; //Se i parametri sono giusti allora la flag rimane true e fa il controllo verso il DB
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client
    let packet_exists = null;
    const checkID = /^[a-f0-9]{24}$/;
 
    const client = await client_to_db.connect();

        try{
    
            if(checkID.test(packet.id)){
                  
                packet_exists = await client.db(db_name).collection("Drafts_packets").findOne({_id:ObjectId.createFromHexString(packet.id)});

                if(packet_exists!= null && packet_exists!= undefined){

                    //Prima di inserire il pacchetto tra i pacchetti attivi, lo elimino dai draft
                    //Successivamente elimino l'id perché il pacchetto avrà un nuovo id tra quelli attivi
                    await client.db(db_name).collection("Drafts_packets").deleteOne({_id:ObjectId.createFromHexString(packet.id)});

                    delete packet_exists._id;
                    
                    await client.db(db_name).collection("Packets").insertOne(packet_exists);

                } else{
                    error_msg.msg.push("There is no draft of this packet");
                }
            } else{
                error_msg.msg.push("Invalid ID");
                valid_input=false;
            }
               
        }
        catch (e) {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json(error_msg); 
        } finally {
            await client.close();
        }

    if(packet_exists==null || packet_exists==undefined || !valid_input)
        res.status(400).json(error_msg); 
    else
        res.status(200).json({'error':false }); 
}

async function deletePacket(id,res){
    const checkID = /^[a-f0-9]{24}$/;
    let valid_input = true;
    let packet_exists = null;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    if(!checkID.test(id)){
        error_msg.msg.push("Invalid packet's ID");
        valid_input = false;
    }

    const client = await client_to_db.connect();

    try{

        if(valid_input){
              //Controllo se il pacchetto esiste
            packet_exists = await client.db(db_name).collection("Packets").findOne({_id:ObjectId.createFromHexString(id)});
    
            if(packet_exists!=null && packet_exists!=undefined){

                //Cancello il pacchetto nelle collections dei pacchetti attivi
                await client.db(db_name).collection("Packets").deleteOne({_id:ObjectId.createFromHexString(id)});

                //Elimino l'id perché inserirò il pacchetto nella collections dei Drafts_packets (quindi avrà un altro id)
                delete packet_exists._id;

                await client.db(db_name).collection("Drafts_packets").insertOne(packet_exists);
            }
            else
                error_msg.msg.push("This packet's ID doesn't exists");
        }
      
   }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
      
   } finally {
       await client.close();
   }

   if(packet_exists==null || packet_exists==undefined || !valid_input)
         res.status(400).json(error_msg); 
   else
         res.status(200).json({'error':false }); 

}

async function getPosts(res){

    let posts;
    const client = await client_to_db.connect();
    let error_msg = {error:true, msg:[]};

    try{
        
        //Prendo tutti i post (nel nostro caso avremo solo 2 post)
        posts = await client.db(db_name).collection("Posts").find().toArray();
   }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
      
   } finally {
       await client.close();
   }

   res.status(200).json(posts);
}

//Modifica l'immagine di un post
async function changeImage(post, res){

    let error_msg = {error:true, msg:[]};
    const client = await client_to_db.connect();

    try{
         await client.db(db_name).collection("Posts").updateOne({index:post.index},{$set:{url:post.url}});
   }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
      
   } finally {
       await client.close();
   }
   res.status(200).json({error:false});
}

//Modifica l'articolo di un post
async function changeArticle(post, res){

    const client = await client_to_db.connect();
    let error_msg = {error:true, msg:[]};

    try{
         await client.db(db_name).collection("Posts").updateOne({index:post.index},{$set:{title:post.title, description:post.description}});
   }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 

   } finally {
       await client.close();
   }
   res.status(200).json({error:false});
}

async function getPaymentInformations(uid,res){

    let user;
    let creditCard; 

    //Non faccio il controllo dell'uid perché viene già fatto dal middleware authUser

        const client = await client_to_db.connect();

             //Controllo che ci sia un utente nella collections user, se non lo dovessi trovare, procedo con la query
             //nelle collections degli admin
        try{

            user = await client.db(db_name).collection("Users").findOne({_id:ObjectId.createFromHexString(uid)});

       }
       catch (e) {
               error_msg.msg.push(`DB Error: ${e.code}`);
               res.status(500).json({error_msg}); 
          
       } finally {
           await client.close();
       }   

    if(user!=null && user!=undefined){
        creditCard=user.creditCard;
        res.status(200).json({creditCard,"error":false});
    }
    else
        res.status(401).json({"msg":"This user doesn't exists", "error":true});
}

async function modifyPaymentSettings(modify,res){

    const checkFirstName = /^[a-z]+ ?[a-z ]*$/i; //nameHolder
    const checkLastName = /^[a-z]+ ?[a-z ]*$/i;  //surnameHolder
    const checkNumber=/^\d{13,16}$/
    const checkCVV = /^\d{3,4}$/;
    const uid = modify.uid;
    const currentDate = new Date();  //Uso la data per fare i controlli sull'expire date
    let currentMonth = currentDate.getMonth() + 1;
    let currentYear = currentDate.getFullYear();
    let valid_input = true;
    let creditCard_exists; //Conterrà i dati della carta di credito attuali, utili per aggiornare correttamente i dati (per il problema dell'updateOne)
    let date; //Verrà inserita la data di scadenza passata dall'utente
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client


    //L'uid mi serve solo per cercare l'utente nel momento della query di update. Elimino il campo uid e lo salto il una variabile
    delete modify.uid;

    if(modify.creditCard.hasOwnProperty("nameHolder")){
        if(!checkFirstName.test(modify.creditCard.nameHolder)){
            error_msg.msg.push("Invalid name holder");
            valid_input = false;
        }
    }

    if(modify.creditCard.hasOwnProperty("surnameHolder")){
        if(!checkLastName.test(modify.creditCard.surnameHolder)){
            error_msg.msg.push("Invalid surname holder");
            valid_input = false;
        }
    }

    if(modify.creditCard.hasOwnProperty("number")){
        if(!checkNumber.test(modify.creditCard.number)){
            error_msg.msg.push("Invalid credit card number");
            valid_input = false;
        }
    }

    if(modify.creditCard.hasOwnProperty("type")){
        //controllo semplicemente i nomi dei circuiti di pagamento
        if(modify.creditCard.type.toLowerCase()!='visa' && (modify.creditCard.type.toLowerCase()!='mastercard')){
            error_msg.msg.push("Invalid type of credit card");
            valid_input = false;
        }
    }

    if(modify.creditCard.hasOwnProperty("expire")){
        date=modify.expireDate.split("/");
        
        //Controllo che la data abbia due elementi (mese e anno)
        if(date.length!=2){
            error_msg.msg.push("Invalid expire date");
            valid_input = false;

        } else{
            date[0]=parseInt(date[0]);
            date[1]=parseInt(date[1]);

            //Controllo che la carta non sia già scaduta e che il mese sia tra 1 e 12
            //parseInt(String(currentYear).substring(2,4)) in questo modo prendo le ultime 2 cifre dell'anno
            if( !((date[0]>=currentMonth && date[1]>=parseInt(String(currentYear).substring(2,4)))
                || (date[0]<=currentMonth && date[1]>parseInt(String(currentYear).substring(2,4)))
                && date[0]>=1 && date[0]<=12) ){
                    error_msg.msg.push("Invalid expire date");
                    valid_input = false;
                }
            
        }
    }

    if(modify.creditCard.hasOwnProperty("cvv")){
        if(!checkCVV.test(modify.creditCard.cvv)){
            error_msg.msg.push("Invalid type of credit card");
            valid_input = false;
        }
    }

    if(valid_input){

        const client = await client_to_db.connect();

        //Il cvv verrà memorizzato 'hashato'
        if(modify.creditCard.hasOwnProperty("cvv"))
            modify.creditCard.cvv=hash(modify.creditCard.cvv);
        
        try{


            //Prendo i dati attuali di creditCards utili per le operazioni successive
            creditCard_exists = await client.db(db_name).collection("Users").findOne({_id:ObjectId.createFromHexString(uid)});
            //Questa funzione viene eseguita solo se la funzione authUser viene eseguita correttamente. 
            //Quindi esisterà un utente
            //La funzione
           

            //Il metodo updateOne di mongoDB non permette di aggiornare un singolo campo di un sotto-oggetto (come nel caso di creditCard).
            //aggiorna il sotto-oggetto eliminando tutti i campi non presenti all'interno del nuovo oggetto, alterando la struttura dei 
            //document. Per questo motivo prendo i campi già esistenti, copio solo quelli non modificati dall'utente, e invio la query
            //con i vecchi dati di creditCards + quelli nuovi. Questa logica si applica solo con i sotto-oggetti. (nel nostro caso solo con creditsCards)
            Object.keys(creditCard_exists.creditCard).forEach( key => {
                if(!modify.creditCard.hasOwnProperty(key))
                    modify.creditCard[key]=creditCard_exists.creditCard[key];
            });

            await client.db(db_name).collection("Users").updateOne({_id:ObjectId.createFromHexString(uid)},{$set:{creditCard:modify.creditCard}});

        }
        catch (e) {
                    error_msg.msg.push(`DB Error: ${e.code}`);
                    res.status(500).json(error_msg);  
            
        } finally {
            await client.close();
            }

        }

    if(!valid_input)
        res.status(400).json(error_msg); 
    else
        res.status(200).json({'error':false }); 
}

//Restituisce l'elenco dei nomi dei supereroi in base alle iniziali fornite dall'utente
async function getHeros(req,res){

    let characters = req.query.nameStartWith;
    let setID = req.query.id;
    let heros = []; 
    const checkCharacters = /^\w[a-z1-9-_.:,,?/&%$*() ]*$/i;

    if(characters!=null && characters!=undefined && checkCharacters.test(characters)){
        await fetch(`https://gateway.marvel.com:443/v1/public/characters?nameStartsWith=${characters}&ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
        .then(response => response.json())
        .then(response => {

            for(let i=0; i<response.data.results.length; i++){

                if(setID!=null && setID!=undefined && Boolean(setID))     
                    heros.push({name:response.data.results[i].name,id:response.data.results[i].id}); 
                 else
                    heros.push(response.data.results[i].name); 
            }

        })
        .catch( error => res.status(500).json({'error':true,'msg':error}));

        res.status(200).json({'error':false,'results':heros});

    } else
        res.status(400).json({'error':true,'msg':'Invalid characters, write a name in query parameter'})
        
}

async function purchasePacket(uid,id, res){

    const checkID = /^[a-f0-9]{24}$/;
    let valid_input = true;
    let packet_exists = null;
    let user;
    let keys; //Conterrà i 5 valori delle carte 
    let cards = []; //Carte da inviare all'utente
    let cards_to_storage = []; //Vettore che conterrà solo le informazioni necessarie per il salvataggio dei dati nel db
    let card_exists; //Serve per capire se una carta è un doppione o no per un determinato utente
    let count_Totalcards; //Conta quante carte sono state inserite
    let offset; //Conterrà l'offset calcolato dalla funzione getOffset
    let count_typeCards; //Conta quante carte di un tipo sono state inserite (es. 3 carte super)
    let new_credits; //In questa variabile inserisco il valore che dovrà essere sottratto dai crediti dell'utente
    let valid_credits; //Flag per capire se l'utente ha abbastanza crediti per procedere all'acquisto
    let exists_creditCard = true;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client
    

    if(!checkID.test(id)){
        error_msg.msg.push("Invalid packet ID");
        valid_input = false;
    }

    if(valid_input){
        
        const client = await client_to_db.connect();

        try{

            //Controllo se esiste il pacchetto
            packet_exists = await client.db(db_name).collection("Packets").findOne({_id:ObjectId.createFromHexString(id)});

            if(packet_exists==null || packet_exists==undefined)
                error_msg.msg.push("This packet doesn't exists");
            else{

                //Controllo che l'utente abbia i crediti necessari per acquistare il pacchetto
                user = await client.db(db_name).collection("Users").findOne({_id:ObjectId.createFromHexString(uid)});

               //Controllo che esistano tutti i campi della carta di credito
               if(!user.creditCard.hasOwnProperty('type') || !user.creditCard.hasOwnProperty('cvv') || !user.creditCard.hasOwnProperty('number')
                || !user.creditCard.hasOwnProperty('nameHolder') || !user.creditCard.hasOwnProperty('expireDate') || !user.creditCard.hasOwnProperty('surnameHolder')) {

                    error_msg.msg.push("Invalid credit card");
                    exists_creditCard = false;

                } else{

                //Controllo che tutti i campi creditCard siano impostati
                Object.keys(user.creditCard).forEach(key => {
                    if((user.creditCard[key] == null || user.creditCard[key] == undefined || user.creditCard[key]=='') &&  exists_creditCard){
                        error_msg.msg.push("Set up a payment method correctly");
                        exists_creditCard = false;
                    }
                });
             }
            
                if(parseFloat(packet_exists.cost) > parseFloat(user.credits)){
                    error_msg.msg.push(`You do not have enough credits to buy the package. You need ${parseFloat(packet_exists.cost)-parseFloat(user.credits)} credits`);
                    valid_credits=false;
                } 
            }

            }
        catch (e) {
                    error_msg.msg.push(`DB Error: ${e.code}`);
                    res.status(500).json(error_msg);  
            
        } finally {
            await client.close();
            }
    }

        if(packet_exists==null || packet_exists==undefined || valid_input==false || valid_credits==false ||  exists_creditCard==false)
            res.status(400).json(error_msg);
        else{

            //Il numero random indica un offset (gli offset della marvel si incrmentano di 20 in 20
            //Offset 0 = pagina 0, offset 20 = pagina 1)
            //Gli offset intermedi presentano sempre le stesse figurine scalate di un posto
            //Sfrutterò questo meccanismo per prendere sempre la prima figurina di un offset
            //(verranno escluse le figurine senza immagine)
            //0 - 79: Carta leggendaria (4 pagine)
            //80  - 199: Carta eroica (6 pagine)
            //200 - 359 : Carta mitica (8 pagine)
            //360 - 599: Carta Super (12 pagine)
            //600 - 999  : Carta comune 


            //Controllo se il numero di carte totali sia diverso da quello delle carte per ogni tipo,
            //e che ci sia la checkbox random attiva. (In ogni casp, pure se non ci dovesse essere
            //il random attivo, ma la somma delle carte per ogni tipo e minore delle carte totali, 
            //procedo a generare il tipo casualmente)


            count_Totalcards = 0;


            //Prendo ogni tipo di carta (legendary, mythics ecc.)
            //e se un campo è maggiore di 0, cerco n carte di quel tipo
            //Non utilizzo il forEach perché l'await non ha effetto nel mio codice.
            //Non verrebbero rispettate le precedenze, partirebbe la fetch del primo do-while
            //con la fetch successiva del while. Si crea un conflitto
            keys = Object.keys(packet_exists.cards);

            for(let i=0; i<keys.length; i++){
                //Se viene indicato un numero preciso maggiore di 0 per il numero di carte di un
                //Certo tipo, allora procedo a prenderle tutte
                if(parseInt(packet_exists.cards[keys[i]])>0  && packet_exists.cards[keys[i]]!='' 
                && packet_exists.cards[keys[i]]!=null && packet_exists.cards[keys[i]]!=undefined && packet_exists.cards[keys[i]]!=NaN){

                    count_typeCards = 0;

                    do{
                        offset = getOffset(String(keys[i]));

                        //Se l'offset è uguale a -1 significa che il nome di una key 
                        //non è scritta in maniera corretta
                        if(offset==-1){
                            error_msg.msg.push("Error during card generation");
                            res.status(500).json(error_msg);

                        } else{
                 
                            await fetch(`https://gateway.marvel.com:443/v1/public/characters?orderBy=-modified&offset=${offset}&limit=1&ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
                            .then(response => response.json())
                            .then(res => {

                                //Se l'immagine non ha un immagine disponibile procedo con un'altra fetch
                                if(!res.data.results[0].thumbnail.path.includes('image_not_available')){
                             
                                        cards.push({
                                            hero:res.data.results[0].id, 
                                            name:res.data.results[0].name, 
                                            image:res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension,
                                            description:res.data.results[0].description,
                                            rarity: getRarity(offset)
                                        });

                                        cards_to_storage.push({
                                            hero:res.data.results[0].id, 
                                            rarity: getRarity(offset),
                                            name:res.data.results[0].name, 
                                            index: offset //Mi servirà per capire il che posizione dell'album inserire la figurina
                                        });
        
                                        count_typeCards++;
                                        count_Totalcards++;
                                }
                            })
                            .catch( error => res.status(500).json({'error':true,'msg':error}));
                        }
                    }while(count_typeCards<parseInt(packet_exists.cards[keys[i]]));       
                }
            }
           
                   
            //Dopo aver preso il numero di carte indicato per ogni tipo, procedo a prendere quelle randomiche
            //(se mancano delle carte al total cards). Non controllo il campo random per motivi di 'sicurezza'
            //preferisco fare un controllo con i numeri effettivi
            while(parseInt(packet_exists.totalCards)>count_Totalcards){

                offset = Math.round(Math.random() * 930);

                await fetch(`https://gateway.marvel.com:443/v1/public/characters?orderBy=-modified&offset=${offset}&limit=1&ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
                                .then(response => response.json())
                                .then(res => {
                                    //Se l'immagine non ha un immagine disponibile procedo con un'altra fetch
                                    if(!res.data.results[0].thumbnail.path.includes('image_not_available')){

                                        cards.push({
                                            hero:res.data.results[0].id, 
                                            name:res.data.results[0].name, 
                                            image:res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension,
                                            description:res.data.results[0].description,
                                            rarity: getRarity(offset)
                                        });

                                        cards_to_storage.push({
                                            hero:res.data.results[0].id, 
                                            rarity: getRarity(offset),
                                            name:res.data.results[0].name, 
                                            index: offset //Mi servirà per capire il che posizione dell'album inserire la figurina
                                        });

                                        count_Totalcards++;
                                    }
                                        
                                })
                                .catch( error => res.status(506).json({'error':true,'msg':error}));
            }

            //Inserisco le carte trovare nel db. Nel caso ci fossero dei doppioni incremento 
            //il campo quantity di una carta

            //Cerco se un utente ha già le carte trovate

            const client = await client_to_db.connect();

            try{

                for(let i=0; i<cards.length; i++){
                    card_exists = await client.db(db_name).collection("Cards").findOne({hero:cards[i].hero, user:uid});

                    //Se un utente ha la carta, incrementiamo solo il campo quantity
                    if(card_exists!=null && card_exists!=undefined){
                        
                    card_exists.quantity = ++card_exists.quantity;

                    cards[i]['quantity']=card_exists.quantity;
                    cards_to_storage[i]['quantity']=card_exists.quantity;
   
                    await client.db(db_name).collection("Cards").updateOne({hero:cards[i].hero, user:uid},{$set:{quantity:card_exists.quantity}});
   
                    } else{
                        cards[i]['quantity']=1;

                        cards_to_storage[i]['quantity']=1;
                        cards_to_storage[i]['user']=uid; 
        
                        await client.db(db_name).collection("Cards").insertOne(cards_to_storage[i]);
                    }
                } 
       
                //Solo se arriva a questo punto senza errori, scalo i soldi all'utente
                new_credits = parseFloat(user.credits) - parseFloat(packet_exists.cost);
    
                await client.db(db_name).collection("Users").updateOne({_id:ObjectId.createFromHexString(uid)},{$set:{credits:new_credits}});

            }
           catch (e) {
                   error_msg.msg.push(`DB Error: ${e.code}`);
                   res.status(500).json(error_msg); 
              
           } finally {
               await client.close();
           }   
            res.status(200).json({cards,error:false});
        }
}

//Questa funzione viene chiamata solo dalla funzione purchase, e serve per calcolare un offset
//per trovare una carta sul sito della marveò
function getOffset(type_card){

    switch(type_card.toLowerCase()){
            case 'legendaries' : return Math.round(Math.random() * 79);
            case 'heroics' :  return Math.round(Math.random() * (199-80) + 80);  //=> Math.random() * (max - min) + min;
            case 'mythics' :  return Math.round(Math.random() * (359-200) + 200);
            case 'super' :  return Math.round(Math.random() * (599-360) + 360);
            case 'commons' :  return Math.round(Math.random() * (999-600) + 600);

            default: return -1;
        }

}

//Questa funzione viene chiamata solo dalla funzione purchase. Dato un offset della marvel,
//dice la rarità di una carta
function getRarity(offset){
    if(offset>=0 && offset<=79)  return 'legendary';
    if(offset>=80 && offset<=199)  return 'heroic';
    if(offset>=200 && offset<=359)  return 'mythic';
    if(offset>=360 && offset<=599)  return 'super';
    if(offset>=600 && offset<=999)  return 'common';
}

async function purchaseCredits(req,res){
    
    let checkCredits = /^[1-9][0-9]*$/;
    let valid_creditCard = true; //Flag per accertarsi che i valori della carta di credito siano validi
    let exists_creditCard = true; //Flag per accertarsi che tutti i campi della carta di credito esistano 
    let uid = req.body.uid;
    let new_credits = req.body.credits; //Crediti che l'utente intende acquistare
    let valid_input = true;
    let user;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    if(!checkCredits.test(parseInt(new_credits))){
        error_msg.msg.push("Invalid credits");
        valid_input = false;
    }

    if(valid_input){

        const client = await client_to_db.connect();

        try{

            user = await client.db(db_name).collection("Users").findOne({_id:ObjectId.createFromHexString(uid)});

            if(user != null && user!= undefined){
               
                //Controllo che esistano tutti i campi della carta di credito
                if(!user.creditCard.hasOwnProperty('type') || !user.creditCard.hasOwnProperty('cvv') || !user.creditCard.hasOwnProperty('number')
                || !user.creditCard.hasOwnProperty('nameHolder') || !user.creditCard.hasOwnProperty('expireDate') || !user.creditCard.hasOwnProperty('surnameHolder')) {
                    error_msg.msg.push("Invalid credit card");
                    exists_creditCard = false;
                }

                if(exists_creditCard){
                    //Controllo che tutti i campi creditCard siano impostati
                    Object.keys(user.creditCard).forEach(key => {
                        if((user.creditCard[key] == null || user.creditCard[key] == undefined || user.creditCard[key]=='') &&  valid_creditCard){
                            error_msg.msg.push("Set up a payment method correctly");
                            valid_creditCard=false;
                        }
                    });

                    if(valid_creditCard){ 
                        if(parseInt(user.credits)!=null && parseInt(user.credits)!=undefined&& parseInt(user.credits)!=NaN)
                            new_credits = parseInt(user.credits)+ parseInt(new_credits);
                        else
                            new_credits = parseInt(new_credits);

                        await client.db(db_name).collection("Users").updateOne({_id:ObjectId.createFromHexString(uid)},{$set:{credits:new_credits}}); 
                    } 
                }

            }
    }
    catch (e) {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json(error_msg); 
        
    } finally {
        await client.close();
    }
  }

  if(!exists_creditCard || !valid_creditCard || !valid_input || user == undefined || user == null)
    res.status(400).json(error_msg); 
  else
    res.status(201).json({'error':false, 'msg':`Start discovering new heroes!\nNew credit: ${new_credits}` }); 

}
    
async function getPageCards(req,res){

    const uid = req.params.uid;
    let offset = req.query.offset;     //Restituisco le carte a gruppi di 20. Se l'offset non viene esplicitato, lo imposto a 0
    const filter = req.query.filter;
    const hero = req.query.hero;
    let data = { error:false,maxTotalCards: total_album_cards, cards:[]}; //max total cards indica il numero massimo di figurine nell'album (trovate e non trovate)
    let cards = [];
    let allCards = [];
    let checkOffset = /^\d*$/;
    let valid_input = true;
    let firstIndexCards; //Conterrà l'index della prima carta di una pagina. Es: pagina 14, la prima carta avrà indice 280. Si fa offset*20
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    //Se l'offset non esiste o ha dei problemi lo imposto di default a 0
    if(!checkOffset.test(offset))
        offset=0;
    else{
        if((offset>(parseInt(total_album_cards)/20) )|| offset<0){
            valid_input=false;
            error_msg.msg.push('Invalid offset');
        }
    }

    if(valid_input){

        //Prendo l'indice della prima carta di una pagina
        firstIndexCards = offset*20;

        const client = await client_to_db.connect();

        try{

            //Se non è indicato alcun filtro, procedo con l'estrazioni delle carte normalmente, 
            //restituendo le carte di una determinata pagina (offset)
            if((filter==null || filter ==undefined || filter=='') && (hero==null || hero==undefined || hero==''))
                cards = await client.db(db_name).collection("Cards").find({user:uid, index:{$gte:firstIndexCards, $lt:(firstIndexCards+20)}}).toArray();
           
            else if((filter==null || filter ==undefined || filter=='') && (hero!=null || hero!=undefined || hero!=''))
                allCards = await client.db(db_name).collection("Cards").find({user:uid, name: { $regex: new RegExp(hero, 'i') } }).toArray(); //Prendo tutte le carte per poi filtrarle in base al nome

            else{
                switch(filter.toLowerCase()){

                    case 'my_cards':    //Prendo tutte le carte
                                        allCards = await client.db(db_name).collection("Cards").find({user:uid}).toArray();
                                        break;
                                        
                    case 'duplicates':  
                                        allCards = await client.db(db_name).collection("Cards").find({user:uid, quantity: {$gt:1}}).toArray();
                                        break;    

                    case 'legendary':  allCards = await client.db(db_name).collection("Cards").find({user:uid, rarity:'legendary'}).toArray();
                                         break;

                    case 'heroic':  allCards = await client.db(db_name).collection("Cards").find({user:uid, rarity:'heroic'}).toArray();
                    break;

                    case 'mythic':  allCards = await client.db(db_name).collection("Cards").find({user:uid, rarity:'mythic'}).toArray();
                    break;

                    case 'super':  allCards = await client.db(db_name).collection("Cards").find({user:uid, rarity:'super'}).toArray();
                    break;

                    case 'common':  allCards = await client.db(db_name).collection("Cards").find({user:uid, rarity:'common'}).toArray();
                    break;
                }
           
                //Se viene settato sia un filtro, sia un eroe, allora prendo gli eroi di una rarità specifica
                if(hero!=null && hero!=undefined && hero!='')
                    allCards = allCards.filter(card => card.name.toLowerCase().includes(hero.toLowerCase()));
                
                //Ora prende le carte in base all'offset. Esempio: offset 0+1 = prime 20 carte
                for(let i=parseInt(offset)*20, j=0; i<(parseInt(offset)+1)*20 && i<allCards.length ;i++, j++)
                    cards[j] = allCards[i];

                data['totalCards']=allCards.length;
            }

            //Ora controllo se l'utente desidera cercare un determinato eroe, o comunque le iniziali di alcuni eroi
            if(hero!=null && hero!=undefined && hero!=''){
                //Ora prende le carte in base all'offset. Esempio: offset 0+1 = prime 20 carte
                for(let i=parseInt(offset)*20, j=0; i<(parseInt(offset)+1)*20 && i<allCards.length ;i++, j++)
                    cards[j] = allCards[i];
            }
            
        }
        catch (e)
         {
                    error_msg.msg.push(`DB Error: ${e.code}`);
                    res.status(500).json(error_msg); 
            
        } finally {
            await client.close();
        }

        //Fetcho le informazioni necessarie da inviare al client per compilare l'album
        for(let i=0; i<cards.length;i++)
            await fetch(`https://gateway.marvel.com:443/v1/public/characters/${cards[i].hero}?ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
            .then(response => response.json())
            .then(res => {

                data.cards.push({

                    //Prendo le informazioni essenziali dal vettore che ho già
                    id:cards[i].hero,
                    name:cards[i].name,
                    rarity:cards[i].rarity,
                    quantity: cards[i].quantity,
                    index:cards[i].index,

                    image:res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension,
                    description:res.data.results[0].description,
                });
            });
    }

    if(!valid_input)
        res.status(400).json(error_msg);
    else 
        res.status(200).json(data);
}

async function getStatistics(uid,res){
    
    let data = { maxTotalCards: total_album_cards};
    let cards;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    const client = await client_to_db.connect();

    try{

        cards = await client.db(db_name).collection("Cards").find({user:uid}).toArray();

        if(cards==null || cards == undefined){
            data['userTotalCards']=0;
            data['legendaries']=0;
            data['heroics']=0;
            data['mythics']=0;
            data['super']=0;
            data['commons']=0;

        } else{
            data['userTotalCards']=cards.length;
            data['legendaries']=cards.filter( card => {return card.rarity == 'legendary'}).length;
            data['heroics']=cards.filter( card => {return card.rarity == 'heroic'}).length;
            data['mythics']=cards.filter( card => {return card.rarity == 'mythic'}).length;
            data['super']=cards.filter( card => {return card.rarity == 'super'}).length;
            data['commons']=cards.filter( card => {return card.rarity == 'common'}).length;
        }

    }
    catch (e) {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json(error_msg); 
        
    } finally {
        await client.close();
    }

    res.status(200).json(data);
}

async function getDetails(req,res){

    const id_hero = parseInt(req.params.hero);
    const uid = req.params.uid;
    let card;
    let valid_hero = true;
    let informations = {};
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    const client = await client_to_db.connect();

    try{
        //Controllo che la card di cui l'utente desidera avere i dettagli sia in suo possesso
        card = await client.db(db_name).collection("Cards").findOne({user:uid,hero:id_hero});

        if(card==null || card==undefined)
            error_msg.msg.push('You do not yet have this figurine in your album. Keep unpacking to find it!');
        else{

            await fetch(`https://gateway.marvel.com:443/v1/public/characters/${id_hero}?ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
            .then(response => response.json())
            .then(res => {

                if(res.code<400){
                    
                    informations['index']=card['index'];
                    informations['rarity']=card['rarity'];
                    informations['quantity']=card['quantity'];
                    informations['name']=card['name'];

                    informations['image']=res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension;
                    informations['description']=res.data.results[0].description;
                    informations['comics']=res.data.results[0].comics.items;
                    informations['series']=res.data.results[0].series.items;
                    informations['stories']=res.data.results[0].stories.items;
                    informations['events']=res.data.results[0].events.items;

                } else{
                    error_msg.msg.push(res.status);
                    valid_hero = false;
                }
    
            });
        }
    }
    catch (e) {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json(error_msg); 
        
    } finally {
        await client.close();
    }

    if(card==null || card==undefined || valid_hero==false)
        res.status(400).json(error_msg);
    else
        res.status(200).json({error:false,informations});

}

async function getComics(comicID, res){

    let informations = {};
    let valid = true;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    await fetch(`https://gateway.marvel.com:443/v1/public/comics/${comicID}?ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
    .then(response => response.json())
    .then(res => {

        if(res.code<400){

            informations['format']=res.data.results[0].format;
            informations['pageCount']=res.data.results[0].pageCount;
            informations['title']=res.data.results[0].title;
            informations['description']=res.data.results[0].description;
            informations['dates']=res.data.results[0].dates;
            informations['image']=res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension;
            informations['creators']=res.data.results[0].creators.items;
            informations['characters']=res.data.results[0].characters.items;
            informations['stories']=res.data.results[0].stories.items;
            informations['events']=res.data.results[0].events.items;
        
        } else{
            error_msg.msg.push(res.status);
            valid = false;
        }

    });

    if(!valid)
        res.status(400).json(error_msg);
    else
        res.status(200).json({error:false, informations})

}

async function getStories(storyID, res){

    let informations = {};
    let valid = true;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    await fetch(`https://gateway.marvel.com:443/v1/public/stories/${storyID}?ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
    .then(response => response.json())
    .then(res => {

        if(res.code<400){

            informations['title']=res.data.results[0].title;
            informations['type']=res.data.results[0].type;
            informations['description']=res.data.results[0].description;
            informations['creators']=res.data.results[0].creators.items;
            informations['characters']=res.data.results[0].characters.items;
            informations['series']=res.data.results[0].series.items;
            informations['comics']=res.data.results[0].comics.items;
            informations['events']=res.data.results[0].events.items;
            informations['originalIssue']=res.data.results[0].originalIssue;

        } else{
            error_msg.msg.push(res.status);
            valid = false;
        }

    });

    if(!valid)
        res.status(400).json(error_msg);
    else
        res.status(200).json({error:false, informations})

}

async function getSeries(serieID, res){

    let informations = {};
    let valid = true;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    await fetch(`https://gateway.marvel.com:443/v1/public/series/${serieID}?ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
    .then(response => response.json())
    .then(res => {

        if(res.code<400){

            informations['title']=res.data.results[0].title;
            informations['description']=res.data.results[0].description;
            informations['creators']=res.data.results[0].creators.items;
            informations['image']=res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension;
            informations['characters']=res.data.results[0].characters.items;
            informations['stories']=res.data.results[0].stories.items;
            informations['comics']=res.data.results[0].comics.items;
            informations['events']=res.data.results[0].events.items;
            informations['startYear']=res.data.results[0].startYear;
            informations['endYear']=res.data.results[0].endYear;

        } else{
            error_msg.msg.push(res.status);
            valid = false;
        }

    });

    if(!valid)
        res.status(400).json(error_msg);
    else
        res.status(200).json({error:false, informations})

}

async function getEvents(eventID, res){

    let informations = {};
    let valid = true;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    await fetch(`https://gateway.marvel.com:443/v1/public/events/${eventID}?ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
    .then(response => response.json())
    .then(res => {

        if(res.code<400){

            informations['title']=res.data.results[0].title;
            informations['description']=res.data.results[0].description;
            informations['creators']=res.data.results[0].creators.items;
            informations['image']=res.data.results[0].thumbnail.path+'.'+res.data.results[0].thumbnail.extension;
            informations['characters']=res.data.results[0].characters.items;
            informations['stories']=res.data.results[0].stories.items;
            informations['comics']=res.data.results[0].comics.items;
            informations['series']=res.data.results[0].series.items;
            informations['next']=res.data.results[0].next;
            informations['previous']=res.data.results[0].previous;
            informations['start']=res.data.results[0].start;
            informations['end']=res.data.results[0].end;

        } else{
            error_msg.msg.push(res.status);
            valid = false;
        }

    });

    if(!valid)
        res.status(400).json(error_msg);
    else
        res.status(200).json({error:false, informations})

}

async function getInformationsCards(req,res) {
    
    const filter = req.query.filter;
    const hero = req.query.hero; //Query di una carta specifica (deve contenere un ID)
    const uid = req.params.uid;
    let valid_input = true;
    let cards;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

        const client = await client_to_db.connect();

        try{

            cards = await client.db(db_name).collection("Cards").find({user:uid}).toArray();

            if(filter!=undefined && filter!=null && filter!=NaN){
                switch(filter){
                    
                    case 'legendary': cards = await client.db(db_name).collection("Cards").find({user:uid,rarity:'legendary'}).toArray();
                                    break;
                                
                    case 'mythic': cards = await client.db(db_name).collection("Cards").find({user:uid,rarity:'mythic'}).toArray();
                                break;
                    
                    case 'heroic': cards = await client.db(db_name).collection("Cards").find({user:uid,rarity:'heroic'}).toArray();
                                break;

                    case 'super': cards = await client.db(db_name).collection("Cards").find({user:uid,rarity:'super'}).toArray();
                                break;

                    case 'common': cards = await client.db(db_name).collection("Cards").find({user:uid,rarity:'common'}).toArray();
                                break;

                    case 'duplicates': cards = await client.db(db_name).collection("Cards").find({user:uid, quantity: {$gt:1}}).toArray();
                                    break;

                    default:
                        error_msg.msg.push('Invalid filter');
                        valid_input = false;
                }
            } 
            else if(hero!=undefined && hero!=null && hero!=NaN)
                cards = await client.db(db_name).collection("Cards").find({user:uid, hero:parseInt(hero)}).toArray();
            else
                cards = await client.db(db_name).collection("Cards").find({user:uid}).toArray();
    
       }
       catch (e) {
                error_msg.msg.push(`DB Error: ${e.code}`);
                res.status(500).json(error_msg); 
          
       } finally {
           await client.close();
       }

       if( cards==undefined || cards==null){
            error_msg.msg.push('Error when withdrawing user cards');
            valid_input = false;    
       }

       if(!valid_input || cards==undefined || cards==null)
            res.status(400).json(error_msg);
       else
            res.status(200).json({error:false, cards});

}

//Metodo usato per capire se l'utente ha inserito più volte la stessa carta
function countOccurence(array, element_to_count){

    let count = 0;

    array.forEach(element => { if(element==element_to_count) count++});

    return count;
}

async function postTrade(req,res){

    let uid = req.body.uid;
    let request = req.body.request;
    let offer = req.body.offer;
    let req_valid_input = false;
    let off_valid_input = false;
    let card_exist; //Flag per capire se una carta esiste
    let user_card; //Conterrà la carta di un'utente contenuta nel db
    let isDuplicate = false; //Flag per capire se tra le carte richieste o offerte, una carta compare più di una volta
    let count_rarityCards = 0;
    let seller;
    let request_specifics = [], offer_specifics=[]; 
    let trade_to_storage = {};
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client
    const checkNumbers = /^[1-9][0-9]*$/;

    //Controllo prima la request
    if(request.credits!=undefined && request.credits!=null & checkNumbers.test(request.credits))
        req_valid_input = true;

    //Calcolo la somma di tutti i tipi di carte che desidera e lo confronto con il numero di carte totali

    Object.keys(request.rarities).forEach( rarity => {
        if(request.rarities[rarity]!=undefined && request.rarities[rarity]!=null && checkNumbers.test(request.rarities[rarity]))
            count_rarityCards+=parseInt(request.rarities[rarity]);
    });

    if(count_rarityCards>0 && !checkNumbers.test(request.totalCards)){
        error_msg.msg.push('Invalid total cards number (request)');
        req_valid_input = false;
    }

    if(count_rarityCards>0 && checkNumbers.test(request.totalCards) && (count_rarityCards!=parseInt(request.totalCards))){
        error_msg.msg.push("The total number of cards does not correspond to the number of cards per type (request)");
        req_valid_input = false;
    }

    if(count_rarityCards>0 && checkNumbers.test(request.totalCards) && (count_rarityCards==parseInt(request.totalCards)))
        req_valid_input = true;

    isDuplicate=false;

    //Controllo se l'utente chiede due carte uguali, alla prima carta ripetuta esco dal ciclo
    for(let i=0; i<request.specifics.length && !isDuplicate; i++){
        if(countOccurence(request.specifics, request.specifics[i]) > 1){
            isDuplicate=true;
            error_msg.msg.push("There are two equal cards (request)");
        }
    }

    if(!isDuplicate)
        req_valid_input = true;
    else
        req_valid_input = false;

        //Se ci sono carte duplicate, evito di rallentare il processo facendo le chiamate alla marvel
    if(!isDuplicate && req_valid_input){
       
        //Controllo che le carte esistano nella marvel, se una carta non esiste, esco immediatamente dal ciclo
        card_exist=true;
     
        for(let i=0; i<request.specifics.length && card_exist;i++){
            
            if(request.specifics[i]!=null && request.specifics[i]!=undefined && request.specifics[i]!=''){ 
                await fetch(`https://gateway.marvel.com:443/v1/public/characters/${request.specifics[i]}?ts=${ts}&apikey=${public_key}&hash=${hashed_key}`)
                .then(response => response.json())
                .then(res => {
                    if(res.data.count<1){
                        card_exist=false;
                        error_msg.msg.push(`The ${request.specifics[i]} card does not exist (request)`);
                    }
                    else
                        request_specifics.push({id:request.specifics[i],name:res.data.results[0].name})
                });
            } else
                card_exist=false;  
        }

        if(card_exist)
            req_valid_input = true;
        else
            req_valid_input= false;
    }

    //Controllo parte offer
    //La parte offer viene controllata soltanto se la parte request è impostata correttamente
    //in questo modo evito di rallentare il processo
    if(req_valid_input){

        if(offer.credits!=undefined && offer.credits!=null && checkNumbers.test(offer.credits))
            off_valid_input=true;

        isDuplicate=false;

        //Controllo se l'utente offre due carte uguali, alla prima carta ripetuta esco dal ciclo
        for(let i=0; i<offer.specifics.length && !isDuplicate; i++){
            if(countOccurence(offer.specifics, offer.specifics[i]) > 1){
                isDuplicate=true;
                error_msg.msg.push("There are two equal cards (offer)");
            }
        }

        if(!isDuplicate)
            off_valid_input = true;
        else
            off_valid_input = false;

        //Se ci sono carte duplicate evito di interrogare il db
        if(!isDuplicate && off_valid_input){

            //Controllo che le carte l'utente offre siano effettivamente sue, e che siano dei doppioni
            const client = await client_to_db.connect();
            
            try{

                //Nel caso l'utente offrisse dei crediti controllo se possiede i crediti sufficienti per pagare
                //In caso di esito positivo verranno scalati
                seller = await client.db(db_name).collection("Users").findOne({_id:ObjectId.createFromHexString(uid) });

                if(seller!=null || seller!=undefined){

                    if( parseInt(seller.credits)<parseInt(offer.credits)){
                        error_msg.msg.push(`You do not have enough credits to offer. You need ${parseInt(offer.credits)-parseInt(seller.credits)} credits (offer)`);
                        off_valid_input = false;
                    }

                    if( parseInt(seller.credits)>=parseInt(offer.credits))
                            off_valid_input=true; 
                }

                if(off_valid_input){
                    card_exist=true;

                    for(let i=0; i<offer.specifics.length && card_exist;i++){

                        if(offer.specifics[i]!=null && offer.specifics[i]!=undefined && offer.specifics[i]!=''){

                            user_card = await client.db(db_name).collection("Cards").findOne({hero:parseInt(offer.specifics[i]),user:uid });

                            if(user_card==null || user_card==undefined)
                                card_exist=false;

                            //Controllo che la carta sia effettivamente un doppione
                            if(user_card!=null && user_card!=undefined && parseInt(user_card.quantity)<2){
                                card_exist=false;
                                error_msg.msg.push(`The quantity of card '${user_card.name}' is less than 2, so it cannot be offered (offer)`);
                            }

                            if(card_exist)
                                offer_specifics.push({id:offer.specifics[i], name: user_card.name })
                            
                        }
                        else
                        card_exist=false;
                    }   

                    if(card_exist)
                        off_valid_input=true;  
                    else
                        off_valid_input=false; 
                    }
                
           }
           catch (e) {
                    error_msg.msg.push(`DB Error: ${e.code}`);
                    res.status(500).json(error_msg); 
              
           } finally {
               await client.close();
           }
        }

        //Se i campi sono impostanti correttamente, procedo con il salvataggio della richiesta nel db
        if(off_valid_input && req_valid_input){

            request.specifics=request_specifics;
            offer.specifics=offer_specifics;

            trade_to_storage = {
                request: request,
                offer: offer,
                seller : {
                    username:seller.username,
                    image: seller.profileImage,
                    id:uid
                },
                buyer: '',
            }

            const client = await client_to_db.connect();

            try{
            
                await client.db(db_name).collection("Trades").insertOne(trade_to_storage);
             
                //Procedo decurtando i crediti offerte, e decrementando le quantità delle carte offerte
                if(checkNumbers.test(offer.credits))
                await client.db(db_name).collection("Users")
                .updateOne({_id:ObjectId.createFromHexString(uid)},{$set:{credits:(parseInt(seller.credits)-parseInt(offer.credits))}}); 

                for(let i=0;i<offer.specifics.length;i++){
                    user_card = await client.db(db_name).collection("Cards").findOne({hero:parseInt(offer.specifics[i].id),user:uid });

                    await client.db(db_name).collection("Cards")
                    .updateOne({hero:parseInt(offer.specifics[i].id),user:uid },{$set:{quantity:parseInt(user_card.quantity)-1}}); 
                }

           }
           catch (e) {
                    error_msg.msg.push(`DB Error: ${e.code}`);
                    res.status(500).json(error_msg); 
              
           } finally {
               await client.close();
           }

        }
    }

    if(!req_valid_input || !off_valid_input)
        res.status(400).json(error_msg);
    else
        res.status(200).json({error:false});
}

async function getTrades(req,res){

    let offset = req.query.offset;
    let uid = req.params.uid; //L'uid mi serve per prendere tutte le richieste dal db, escluse quelle della persona che fa la chiamata
    let filter = req.query.trade;
    const checkOffset = /^[0-9]$/;
    let trades;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    //Se l'offset è indicato lo moltiplico per 20
    checkOffset.test(offset)?offset=parseInt(offset)*20:offset=0;

    const client = await client_to_db.connect();

    try{

        switch(filter){

            case "open": trades = await client.db(db_name).collection("Trades").find({ "seller.id": { $ne: uid }, buyer: ''} ).skip(parseInt(offset)).limit(20).toArray();
                         break;

            case "close": trades = await client.db(db_name).collection("Trades").find({ "seller.id": { $ne: uid }, buyer:  { $ne: '' }} ).skip(parseInt(offset)).limit(20).toArray();
                          break;
            default:
                trades = await client.db(db_name).collection("Trades").find({ "seller.id": { $ne: uid }} ).skip(parseInt(offset)).limit(20).toArray();
        }

        trades.forEach(element => {
            delete element.seller.id;
            delete element.buyer.id;
        });

    }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
      
   } finally {
       await client.close();
   }
   res.status(200).json(trades)
}

async function getUserOffers(req,res){
    
    let trades;
    let uid = req.params.uid;
    let filter = req.query.trade;
    let error_msg = { error:true, msg:[]}; //All'interno inserisco tutti gli eventuali messaggi d'errore da mandare al client

    const client = await client_to_db.connect();

    try{

        switch(filter){

            case "open": trades = await client.db(db_name).collection("Trades").find({ "seller.id":  uid , buyer: ''} ).toArray();
                         break;

            case "close": trades = await client.db(db_name).collection("Trades").find({ "seller.id": uid , buyer:  { $ne: '' }} ).toArray();
                          break;
            default:
                trades = await client.db(db_name).collection("Trades").find({ "seller.id":  uid } ).toArray();
            }

    }
   catch (e) {
            error_msg.msg.push(`DB Error: ${e.code}`);
            res.status(500).json(error_msg); 
      
   } finally {
       await client.close();
   }

   res.status(200).json(trades)
}

async function deleteOffer(req,res){

    const checkID = /^[a-f0-9]{24}$/;
    let offer_id = req.params.id;
    let uid = req.params.uid;
    let trade;
    let new_credits;
    let card;
    let user;
    let valid_input=true;
    let error_msg = {error:true, msg:[]};

    if(!checkID.test(offer_id)){

        valid_input=false;
        error_msg.msg.push("Invalid trade ID");

    } else{

        const client = await client_to_db.connect();

        try{

            
            trade = await client.db(db_name).collection("Trades").findOne({_id:ObjectId.createFromHexString(offer_id)});

            if(trade ==null || trade ==undefined){
                valid_input=false;
                error_msg.msg.push("Invalid trade ID");

            } else{
                 //Restituisco i crediti e le carte doppie offerte
            
                    user = await client.db(db_name).collection("Users").findOne({_id:ObjectId.createFromHexString(uid)});

                    //Restituisco eventuali crediti/carte offerte

                    if(trade.offer.credits!=undefined && trade.offer.credits!=null && trade.offer.credits!='')
                        if(parseInt(trade.offer.credits)>0){
                            new_credits = parseInt(trade.offer.credits);
                            new_credits+= parseInt(user.credits)
                            await client.db(db_name).collection("Users").updateOne({_id:ObjectId.createFromHexString(uid)},{ $set: {credits:new_credits}});

                        }

                    for(let i=0; i<trade.offer.specifics.length && valid_input; i++){
                    
                        card = await client.db(db_name).collection("Cards").findOne({user:uid,hero:parseInt(trade.offer.specifics[i].id)});;

                        if(card==undefined || card==null || !card.hasOwnProperty('quantity')){
                            valid_input=false;
                            error_msg.msg.push("Error while restoring offered cards");
                            
                        } else{
                
                            await client.db(db_name).collection("Cards").updateOne({user:uid,hero:parseInt(trade.offer.specifics[i].id)},{ $set: {quantity:parseInt(card.quantity)+1}});
                        }
                    }

                    await  client.db(db_name).collection("Trades").deleteOne({_id:ObjectId.createFromHexString(offer_id)});
                }

           
        }
        catch (e) {
                    error_msg.msg.push(`DB Error: ${e.code}`);
                    res.status(500).json(error_msg); 
            
        } finally {
            await client.close();
        }
    }
    
    if(!valid_input)
        res.status(400).json(error_msg);
    else
    res.status(200).json({'error':false});
}

async function tradeDeal(req,res){

    let valid_input = true;
    let trade_id = req.body.trade;
    let buyer_id = req.body.uid;
    let rarities = req.body.rarities;
    let keys;
    let user;
    let card;
    let trade;
    let new_credits = null;
    let new_quantity;
    let new_card = {};
    let generics_cards = []; //Questi due array conterranno le carte da scambiare. Durante i controlli delle carte, le memorizzo anche 
    let specific_cards = []; //in questi array. In questo modo, quando dovrò aggiornare le quantità da decrementare (o in caso eliminare la carta se la quantita è 1), faccio 
                             //riferimento a questi vettori, senza fare altre query inutili al DB. Sono le carte richieste
    let error_msg = {error:true, msg:[]};

    const checkNumber = /^[1-9][0-9]*$/;

    const client = await client_to_db.connect();

        try{

            trade = await client.db(db_name).collection("Trades").findOne({_id: ObjectId.createFromHexString(trade_id)});
            
            keys = Object.keys(trade.request.rarities);

            if(trade==undefined || trade==null || trade==''){
                valid_input=false;
                error_msg.msg.push('Invalid trade ID');

            } else{

                if(trade.buyer!='' && trade.buyer!=undefined && trade.buyer!=null){
                    valid_input=false;
                    error_msg.msg.push('Deal already closed');
                }

                if(valid_input){

                    //Se nella richiesta vengono indicati dei crediti, controllo che il potenziale acquirante abbia i crediti necessari
                    user = await client.db(db_name).collection("Users").findOne({_id: ObjectId.createFromHexString(buyer_id)});

                    if(checkNumber.test(trade.request.credits)){

                        if(user!=undefined && user!=null){
                           
                            if(parseInt(user.credits)<parseInt(trade.request.credits)){
                                valid_input=false;
                                error_msg.msg.push(`You do not have enough credits to proceed with the deal. You need ${parseInt(trade.request.credits)-parseInt(user.credits)} credits`);
                            }

                        }

                    }

                    //Controllo se l'utente ha inserito delle carte totali (riferite a quelle generiche per rarità)
                    if(checkNumber.test(trade.request.totalCards)){
                        
                        for(let i=0; i<keys.length; i++){
                            //Controllo se esiste la rarità, e se tale rarità è contenuta nella richiesta es. legendary:3
                            if(!rarities.hasOwnProperty(keys[i]) && checkNumber.test(trade.request.rarities[keys[i]])){
                                valid_input=false;
                                error_msg.msg.push(`Missing ${keys[i]} field`);
                            }

                            //Controllo che le carte inserite per rarità siano lo stesso numero delle carte richieste
                            if(rarities.hasOwnProperty(keys[i]) && checkNumber.test(trade.request.rarities[keys[i]])){
                                if(parseInt(trade.request.rarities[keys[i]])!=rarities[keys[i]].length){
                                    valid_input=false;
                                    error_msg.msg.push(`The required ${keys[i]} cards are ${trade.request.rarities[keys[i]]}, you only entered ${rarities[keys[i]].length}!`);
                                }
                                    
                            }
                        }

                        if(valid_input){

                            //Controllo se ci sono carte doppie
                            for(let i=0;i<keys.length && valid_input;i++){
                                if(rarities.hasOwnProperty(keys[i]))
                                    for(let j=0;j<rarities[keys[i]].length && valid_input;j++)
                                        if(countOccurence(rarities[keys[i]],rarities[keys[i]][j]) > 1){
                                            valid_input=false;
                                            error_msg.msg.push(`Double ${keys[i]} cards were found`);   
                                        }      
                            }

                            //Se fino a questo punto è tutto corretto, procedo ad interrogare il DB per capire se l'utente ha effettivamente le carte richieste 
                            for(let i=0;i<keys.length && valid_input; i++){

                                if(rarities.hasOwnProperty(keys[i]))
                                    //Accedo agli array fi ogni rarità
                                    for(let j=0; j<rarities[keys[i]].length && valid_input; j++ ){

                                        card = await client.db(db_name).collection("Cards").findOne({user:buyer_id, hero:parseInt(rarities[keys[i]][j])});

                                        if(card==undefined || card==null){
                                            valid_input=false;
                                            error_msg.msg.push(`Warning, you do not possess all the ${keys[i]} cards indicated`);   
                                        }

                                        generics_cards.push(card);
                                    }

                            }

                        }
                    }

                    //Controllo che l'utente che desidera accettare la richiesta, abbia le carte specifiche richieste
                    if(trade.request.specifics.length>0){

                        for(let i=0; i<trade.request.specifics.length;i++){
                            card = await client.db(db_name).collection("Cards").findOne({user:buyer_id, hero:parseInt(trade.request.specifics[i].id)});

                            if(card==undefined || card==null){
                                valid_input=false;
                                error_msg.msg.push(`You do not have the required '${trade.request.specifics[i].name}' card`);
                            }

                            specific_cards.push(card);
                        }
                    }

                    //Se è tutto corretto procedo con l'accordo, decrementando le quantità 
                    //(o eventualmente eliminare le carte nel caso la quantità fosse 1), e/o decrementare i crediti del buyer
                    //+ aggiungo le carte e/o crediti offerti dal creatore della richiesta
                    if(valid_input){

                        if(checkNumber.test(trade.request.credits)){
                            //Per evitare di fare 2 update al DB, faro' l'update dei credits dopo aver fatto i controlli anche per i crediti dell'offerta
                            new_credits = parseInt(user.credits)-parseInt(trade.request.credits);
                        }

                        if(checkNumber.test(trade.request.totalCards)){
                            
                            for(let i=0;i<generics_cards.length;i++){
                                //Se la carta da scambiare ha quantità pari ad 1, procedo eliminandola dal db 
                                if(parseInt(generics_cards[i].quantity)==1)
                                    await  client.db(db_name).collection("Cards").deleteOne({user:buyer_id,hero:parseInt(generics_cards[i].hero)});
                                else{                                   
                                    new_quantity=(generics_cards[i].quantity-1);
                                    await client.db(db_name).collection("Cards").updateOne({user:buyer_id,hero:parseInt(generics_cards[i].hero)},{$set:{quantity:new_quantity}});
                                }
                            }
                        }

                        if(trade.request.specifics.length>0){
                            for(let i=0;i<specific_cards.length;i++){
                                //Se la carta da scambiare ha quantità pari ad 1, procedo eliminandola dal db 
                                if(parseInt(specific_cards[i].quantity)==1)
                                    await  client.db(db_name).collection("Cards").deleteOne({user:buyer_id,hero:parseInt(specific_cards[i].hero)});
                                else{                                   
                                    new_quantity=(specific_cards[i].quantity-1);
                                    await client.db(db_name).collection("Cards").updateOne({user:buyer_id,hero:parseInt(specific_cards[i].hero)},{$set:{quantity:new_quantity}});
                                }
                            }      
                        }
                       
                        if(checkNumber.test(trade.offer.credits)){

                            //Per evitare di interrogare nuovamente il DB per conoscere lo stato attuale dei crediti 
                            //dato che potrebbe esser cambiato a causa dei soldi decrementati durante i controlli per la richiesta di credit
                            //utilizzo il new_credits. Se = null allora il campo credits non è cambiato e posso prendere i creditis contenuti in user
                            if(new_credits==null)
                                new_credits=parseInt(user.credits)+parseInt(trade.offer.credits);
                            else
                                new_credits+=parseInt(trade.offer.credits);
                            
                        }

                        if(checkNumber.test(trade.request.credits) || checkNumber.test(trade.offer.credits))
                            await client.db(db_name).collection("Users").updateOne({_id:ObjectId.createFromHexString(buyer_id)},{$set:{credits:new_credits}});
                        
                        if(trade.offer.specifics.length>0){

                            for(let i=0;i<trade.offer.specifics.length;i++){

                                //Controllo se la carta è già in posesso del buyer. Se cosi fosse, procedo incrementando la quantità, altrimenti la aggiungo
                                card = await client.db(db_name).collection("Cards").findOne({user:buyer_id, hero:parseInt(trade.offer.specifics[i].id)});

                                if(card==undefined || card==null || card==NaN){

                                    //Prendo la carta da scambiare per prendere tutte le informazioni necessarie, come index e rarity
                                    card = await client.db(db_name).collection("Cards").findOne({user:trade.seller.id, hero:parseInt(trade.offer.specifics[i].id)});

                                    new_card['hero']=parseInt(trade.offer.specifics[i].id);
                                    new_card['rarity']=card.rarity;
                                    new_card['name']=card.name;
                                    new_card['index']=card.index;
                                    new_card['quantity']=1;
                                    new_card['user']=buyer_id;
                                    await client.db(db_name).collection("Cards").insertOne(new_card);
                                } else{
                                    new_quantity=parseInt(card.quantity)+1;
                                    await client.db(db_name).collection("Cards").updateOne({user:buyer_id,hero:parseInt(trade.offer.specifics[i].id)},{$set:{quantity:new_quantity}});
                                }
 
                            }
                        }    
                    
                        //Alla fine procedo inserendo il buyer tra i campo del trade, chiudendo cosi l'affare
                        await client.db(db_name).collection("Trades").updateOne({_id: ObjectId.createFromHexString(trade_id)},{$set:{buyer:user.username}});
                    }
                }

            }
           
        }
        catch (e) {
                    error_msg.msg.push(`DB Error: ${e.code}`);
                    res.status(500).json(error_msg); 
            
        } finally {
            await client.close();
        }

        if(!valid_input)
            res.status(400).json(error_msg);
        else
            res.status(200).json({error:false}); 
}










  

