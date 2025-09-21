const uidUser = localStorage.getItem("uid");
const checkID = /^[a-f0-9]{24}$/;

function authAccess(){

    if(uidUser==null ||uidUser==undefined || !checkID.test(uidUser)){
        alert("Unauthorized access");
        return false;   
    }
    return true;
}

function getInformations(){

    let field_name = document.getElementById("field_firstName");
    let field_lastName = document.getElementById("field_lastName");
    let field_username = document.getElementById("field_username");
    let field_email = document.getElementById("field_email");
    let field_hero = document.getElementById("field_hero");
    let button_hero = document.getElementById("hero_button");
    let aside_photo = document.getElementById("profileImage");
    let aside_username = document.getElementById("aside_username");
    let aside_email = document.getElementById("aside_email");
    let aside_signupDate = document.getElementById("aside_signupDate");
    let aside_credits = document.getElementById("aside_credits");
    let aside_totalCards = document.getElementById("aside_totalCards");
    
    if(!authAccess()){
        logout();

    } else{

       fetch(`http://localhost:3000/user/${uidUser}`)
        .then(response => response.json())
        .then(data => {

            if(data.error){
                let list = document.getElementById("msg_list");

                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else{

                field_name.value = data.user.firstName;
                field_lastName.value = data.user.lastName;
                field_username.value = data.user.username;
                field_email.value = data.user.email;

                aside_username.innerText = data.user.username;
                aside_email.innerText = data.user.email;
                aside_signupDate.innerText = data.user.signupDate;
                aside_photo.src = data.user.profileImage;

                //Inserisco anche i dati inerenti alla carta di credito
                //Questo solo se l'utente ha l'oggetto creditCard (quindi se è un utente base)
                //L'admin non vedrà la schermata credit card
                if(!data.user.hasOwnProperty("creditCard")){
                    document.getElementById("credit-card-tab").classList.add("d-none");

                } else{
                    setCreditCard(data.user.creditCard);
                }

                //Inserisco i parametri anche nei campi non visibili per confrontrarli in caso di modifica dei dati
                document.getElementById('field_compare_firstName').value=data.user.firstName;
                document.getElementById('field_compare_lastName').value=data.user.lastName;
                document.getElementById('field_compare_username').value=data.user.username;
                document.getElementById('field_compare_email').value=data.user.email;

                if(!data.user.hasOwnProperty("credits"))
                    aside_credits.innerText = "-";
                else
                    aside_credits.innerText = data.user.credits;

            
                if(!data.user.hasOwnProperty("totalCards"))
                    aside_totalCards.innerText = "-";
                else
                    aside_totalCards.innerText = data.user.totalCards+"/"+data.user.maxTotalCards; 

                if(!data.user.hasOwnProperty("hero")){
                    field_hero.classList.add("d-none");
                    document.getElementById("field_label_hero").classList.add("d-none");
                }
                    
                else{
                    button_hero.innerText = data.user.hero; 
                    button_hero.name=data.user.hero;
                    document.getElementById('hero_compare_button').name=data.user.hero;
                }

            }

        });

    }
}

//In questa funzione passo l'oggetto creditCard ottenuto dalla fetch del getInformation
//Il get information ci restituisce tutte le informazioni inerenti a un user
//per questo non ho voluto fare un'altra chiamata per ottenere solo le informazioni inerenti alla carta di credito
//cioè alla rotta (get /payment/:uid)
function setCreditCard(data){

    let nameHolder = document.getElementById("nameHolder");
    let surnameHolder = document.getElementById("surnameHolder");
    let cardNumber = document.getElementById("cardNumber");
    let visa = document.getElementById("visa");
    let mastercard = document.getElementById("mastercard");
    let expire = document.getElementById("expire_creditCard");

        nameHolder.value=data.nameHolder;
        surnameHolder.value=data.surnameHolder;
        cardNumber.value=data.number;
        expire.value = data.expireDate;


        //Inserisco i valori anche nei campi non visibili per fare il confronto in caso di modifiche
        document.getElementById("compare_nameHolder").value=data.nameHolder;
        document.getElementById("compare_surnameHolder").value=data.surnameHolder;
        document.getElementById("compare_cardNumber").value=data.number;
        document.getElementById("compare_expire_creditCard").value=data.expireDate;

        if(data.type!=null && data.type!=undefined){
            if(data.type.toLowerCase()=="visa"){
                visa.checked=true;
                visa.classList.add("active");
                mastercard.checked=false;
                mastercard.classList.remove("active");
                document.getElementById("compare_visa").checked=true;
                document.getElementById("compare_visa").classList.add("active");
        
            }
            else if(data.type.toLowerCase()=="mastercard"){
                mastercard.checked=true;
                mastercard.classList.add("active");
                visa.checked=false;
                visa.classList.remove("active")
                document.getElementById("compare_visa").checked=false;
                document.getElementById("compare_visa").classList.remove("active");
                document.getElementById("compare_mastercard").checked=true;
                document.getElementById("compare_mastercard").classList.add("active");
            }
            else{
                visa.checked=false;
                visa.classList.remove("active");
                mastercard.checked=false;
                mastercard.classList.remove("active");
                document.getElementById("compare_visa").checked=false;
                document.getElementById("compare_mastercard").checked=false;
                document.getElementById("compare_visa").classList.remove("active");
                document.getElementById("compare_mastercard").classList.remove("active");
            }   
        }
         
}

function getModifiedFields(class_compare){

    let fields = document.getElementsByClassName(class_compare);
    let fields_to_send = {};

    //Incremento di 2 perchè i campi visibili si trovano nelle posizioni pari del vettore 
    //Il vettore ha un elemento visibile in posizione i, e un elemento invisibile per comprare
    //eventuali modifiche in posizione i+1
    for(let i=0;i<fields.length-1;i+=2){         

        if(fields[i].value!=fields[i+1].value)
           fields_to_send[`${fields[i].name}`]=fields[i].value;

        else if(fields[i].classList.contains("hero")){
            if(fields[i].name!=fields[i+1].name) //l'id dell'eroe è contenuto nell'attributo name
                fields_to_send['hero']=fields[i].name;
        }
        
        else if(fields[i].type=="radio"){ //In questo if ci entrerà soltanto nel caso della carta di credito (perchè usa i radio button)
           
            //Se  ha la classe active significa che è il tipo di carta attuale
            if(!fields[i].classList.contains("active") && fields[i].checked==true){
                //Siccome il name è già occupato da bootstrap per i suoi controlli, faccio i controlli con la classe
                // visa e mastercard per assegnare la variabile

                if(fields[i].classList.contains("visa"))
                    fields_to_send['type']="visa";

                else if(fields[i].classList.contains("mastercard"))
                    fields_to_send['type']="mastercard";
            }

        } 
    } 
   return fields_to_send;

}

 function changeInformations(){

    let waiting_window = document.getElementById('waiting');

    waiting_window.classList.remove('d-none');
    
    let user = getModifiedFields("field_compare_info");
    options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({
            uid: uidUser,
            user
        })};

    if(JSON.stringify(user)!='{}'){

      fetch('http://localhost:3000/user',options)
        .then(response => response.json())
        .then(data => {

            waiting_window.classList.add('d-none');

            if(data.error){
                let list = document.getElementById("msg_list");

                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });
            } else
                location.reload();

        });

    }
}

function changePassword(){

    let waiting_window = document.getElementById('waiting');

    waiting_window.classList.remove('d-none');

    let newPassword = document.getElementById("password").value;
    let user ={password:newPassword}; //Inserisco la password il un oggetto perché la funzione del server
    //vuole le modifiche all'interno di un oggetto user

    options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({
            uid: uidUser,
            user
        })
    };

        fetch('http://localhost:3000/user',options)
        .then(response => response.json())
        .then(data => {

            waiting_window.classList.add('d-none');

            if(data.error){
                let list = document.getElementById("msg_list");

                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });
            } else
                location.reload();

        });

}

function changePayment(){

    let creditCard = getModifiedFields("field_compare_pay");
    let waiting_window = document.getElementById('waiting');

    waiting_window.classList.remove('d-none');

    options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({
            uid: uidUser,
            creditCard
        })};

    if(JSON.stringify(creditCard)!='{}'){

        fetch('http://localhost:3000/payment',options)
        .then(response => response.json())
        .then(data => {

            waiting_window.classList.add('d-none');

            if(data.error){
                let list = document.getElementById("msg_list");

                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });
            
            } else
                location.reload();

        });

    }
}

function sendFormInformations(){

    if(!authAccess()){
        logout();

    } else{
    if(checkFirstName("field_firstName","label_firstName"))
        if(checkLastName("field_lastName","label_lastName"))
            if(checkUsername("field_username","label_username"))
                if(checkEmail("field_email","label_email"))
                    changeInformations();
    }

}

function sendFormSecurity(){
    if(!authAccess()){
        logout();

    } else{
        if(checkPassword("password","label_password"))
            if(checkVerifyPassword("password","verifyPassword","label_verifyPassword"))
                changePassword();
    }
}

function sendFormPayment(){

    let creditCard= getModifiedFields('field_compare_pay');
    if(!authAccess()){
        logout();

    } else{
        if(checkFirstName('nameHolder','label_nameHolder'))
            if(checkLastName('surnameHolder','label_surnameHolder'))
                if(checkNumberCard('cardNumber','compare_cardNumber'))
                    if(checkTypePayment())
                        if(checkExpire('expire_creditCard','label_expire_creditCard'))
                            if(checkCVV())
                                changePayment();
    }


}

function checkFirstName(input,label_input){

    const checkName = /^[a-z]+ ?[a-z ]*$/i;
    let name = document.getElementById(input);
    let label = document.getElementById(label_input);

    if(checkName.test(name.value)){
        name.classList.remove("border");
        name.classList.remove("border-3");
        name.classList.remove("border-danger");
        label.classList.remove("text-danger");
        return true;

      } else{
        name.classList.add("border");
        name.classList.add("border-3");
        name.classList.add("border-danger");
        label.classList.add("text-danger");
        return false;
    }

}

function checkLastName(input,label_input){

    const checkLastName = /^[a-z]+ ?[a-z ]*$/i;
    let lastName = document.getElementById(input);
    let label = document.getElementById(label_input);

    if(checkLastName.test(lastName.value)){
        lastName.classList.remove("border");
        lastName.classList.remove("border-3");
        lastName.classList.remove("border-danger");
        label.classList.remove("text-danger");
        return true;
    } else{
        lastName.classList.add("border");
        lastName.classList.add("border-3");
        lastName.classList.add("border-danger");
        label.classList.add("text-danger");
        return false;
    }
}

function checkUsername(input,label_input){

   const checkUsername = /^[a-z0-9_-]{3,15}$/i;

   let username = document.getElementById(input);
   let label = document.getElementById(label_input);

   if(checkUsername.test(username.value)){
        username.classList.remove("border");
        username.classList.remove("border-3");
        username.classList.remove("border-danger");
        label.classList.remove("text-danger");
        label.innerText="Username";
        return true;
   } else{
        username.classList.add("border");
        username.classList.add("border-3");
        username.classList.add("border-danger");
        label.classList.add("text-danger");
        label.innerText="Username (min length: 3, max length: 15, Allowed symbols: a-z A-Z 0-9 _ -)";
        return false;
   }

}

function checkEmail(input,label_input){

    const checkEmail = 	/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let email = document.getElementById(input);
    let label = document.getElementById(label_input);
  
    if(checkEmail.test(email.value)){
        email.classList.remove("border");
        email.classList.remove("border-3");
        email.classList.remove("border-danger");
        label.classList.remove("text-danger");
        return true;
    } else{
        email.classList.add("border");
        email.classList.add("border-3");
        email.classList.add("border-danger");
        label.classList.add("text-danger");
        label.innerText="Invalid Email address";
        return false;
    }


}

function checkPassword(input,label_input){

    const checkPassword = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    let password = document.getElementById(input);
    let label = document.getElementById(label_input);

    if(checkPassword.test(password.value)){
        password.classList.remove("border");
        password.classList.remove("border-3");
        password.classList.remove("border-danger");
        label.classList.remove("text-danger");
        label.innerText="Password";
        return true;
    } else{
        password.classList.add("border");
        password.classList.add("border-3");
        password.classList.add("border-danger");
        label.classList.add("text-danger");
        label.innerText="Password (min length: 8, Must contain at least one uppercase letter, one lowercase letter, a number and special character)";
        return false;
    }
    
}

//non faccio un controllo con la regex perché deve essere uguale alla password
//inserita in precedenza. La password inserita in precedenza dovrà comunque rispettare le regole della regex
function checkVerifyPassword(input,verify_input,label_input){

    let password = document.getElementById(input);
    let verifyPassword = document.getElementById(verify_input);
    let label = document.getElementById(label_input);

    if(verifyPassword.value === password.value){
        verifyPassword.classList.remove("border");
        verifyPassword.classList.remove("border-3");
        verifyPassword.classList.remove("border-danger");
        label.classList.remove("text-danger");
        label.innerText="Verify password";
        return true;
    }else{
        verifyPassword.classList.add("border");
        verifyPassword.classList.add("border-3");
        verifyPassword.classList.add("border-danger");
        label.classList.add("text-danger");
        label.innerText="Password doesn't match";
        return false;
    }
}

function checkNumberCard(input,label_input){

    const checkNumber=/^\d{13,16}$/
    let number = document.getElementById(input);
    let label = document.getElementById(label_input);

    if(checkNumber.test(number.value)){
        number.classList.remove("border");
        number.classList.remove("border-3");
        number.classList.remove("border-danger");
        label.classList.remove("text-danger");
        return true;
    } else{
        number.classList.add("border");
        number.classList.add("border-3");
        number.classList.add("border-danger");
        label.classList.add("text-danger");
        return false;
    }

}

function checkExpire(input,label_input){

    let date = document.getElementById(input);
    let label = document.getElementById(label_input);

    const currentDate = new Date();
    let currentMonth = currentDate.getMonth() + 1;
    let currentYear = currentDate.getFullYear();
    
    let input_date=date.value.split("/");//In posizione 0 c'è il mese, in posizione 1 l'anno
    input_date[0]=parseInt(input_date[0]);
    input_date[1]=parseInt(input_date[1]);


    //Controllo che la carta non sia già scaduta e che il mese sia tra 1 e 12
    //parseInt(String(currentYear).substring(2,4)) in questo modo prendo le ultime 2 cifre dell'anno
   if( ((input_date[0]>=currentMonth && input_date[1]>=parseInt(String(currentYear).substring(2,4)))
        || (input_date[0]<=currentMonth && input_date[1]>parseInt(String(currentYear).substring(2,4))))
        && input_date[0]>=1 && input_date[0]<=12 ){

        date.classList.remove("border");
        date.classList.remove("border-3");
        date.classList.remove("border-danger");
        label.classList.remove("text-danger");
        return true;
    } else{
        date.classList.add("border");
        date.classList.add("border-3");
        date.classList.add("border-danger");
        label.classList.add("text-danger");
        return false;
    }
}

function checkTypePayment(){

    let visa = document.getElementById("visa");
    let mastercard = document.getElementById("mastercard");

    if(visa.checked!=false || mastercard.checked!=false){
        visa.classList.remove("border");
        visa.classList.remove("border-3");
        visa.classList.remove("border-danger");
        mastercard.classList.remove("border");
        mastercard.classList.remove("border-3");
        mastercard.classList.remove("border-danger");
        return true;
    } else{
        visa.classList.add("border");
        visa.classList.add("border-3");
        visa.classList.add("border-danger");
        mastercard.classList.add("border");
        mastercard.classList.add("border-3");
        mastercard.classList.add("border-danger");
        return false;
    }


}

function checkCVV(){

    const checkcvv = /^\d{3,4}$/;
    let cvv = document.getElementById("cvv");
    let label = document.getElementById("label_cvv");

    if(checkcvv.test(cvv.value)){
        cvv.classList.remove("border");
        cvv.classList.remove("border-3");
        cvv.classList.remove("border-danger");
        label.classList.remove("text-danger");
        return true;
    } else{
        cvv.classList.add("border");
        cvv.classList.add("border-3");
        cvv.classList.add("border-danger");
        label.classList.add("text-danger");
        return false;
    }

}

function checkHero(){

    const checkHero = /^\d+$/;
    let hero = document.getElementById("hero_button"); //L'id è contenuto nel name
    let label = document.getElementById("l_hero");

    if(checkHero.test(hero.name)){
        hero.classList.remove("border");
        hero.classList.remove("border-3");
        hero.classList.remove("border-danger");
        label.classList.remove("text-danger");
        label.innerText="Favorite Hero";
        return true;
    } else{
        hero.classList.add("border");
        hero.classList.add("border-3");
        hero.classList.add("border-danger");
        label.classList.add("text-danger");
        label.innerText="Select a hero";
        return false;
    }
}

async function deleteUser(){

    options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    };

    await fetch(`http://localhost:3000/user/${uidUser}`,options)
    .then(response => response.json())
        .then(data => {

            if(data.error){
                let list = document.getElementById("msg_list");

                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });
            }
             else
              logout();
        });

       
}

function findHeros(){

    const checkCharacters = /^\w[a-z1-9-_.:,,?/&%$*() ]*$/i;
    let nameStart_hero = document.getElementById('hero_name').value;
    let loading = document.getElementById('loading');
    let loading_img = document.getElementById('loading_img');
    let loading_msg = document.getElementById('loading_msg');
    let heros_list = document.getElementById('heros_list');

    //Ogni volta che viene schiacciata la lente di ingrandimento, imposto l'immagine di loading
    //e nascondo il menu dei risultati
    loading_img.src="https://media.tenor.com/ZI5hpnSdQGkAAAAi/eternals-marvel-studios.gif";
    loading_msg.innerText="Loading...";
    loading.classList.remove('d-none');
    heros_list.classList.add('d-none');

    if(nameStart_hero!=null && nameStart_hero!=undefined && checkCharacters.test(nameStart_hero)){

        fetch(`http://localhost:3000/heros?nameStartWith=${nameStart_hero}`)
        .then(response => response.json())
        .then(res =>{

            if(res.error){
                loading_img.src="https://media.tenor.com/zQM6QTjo3FMAAAAi/ms-marvel-marvel-studios.gif";
                loading_msg.innerText=res.msg;

            } else{

                if(res.results<1){
                    loading_img.src="https://media.tenor.com/zQM6QTjo3FMAAAAi/ms-marvel-marvel-studios.gif";
                    loading_msg.innerText=res.innerText="Hero not found";

                } else{
                    loading.classList.add('d-none');
                    heros_list.classList.remove('d-none');

                    //Inizializzo la lista
                    heros_list.innerHTML='';

                    //Separo key e value, creando un array prendendo solo le key
                    //Inserisco tutti i valori nel select degli eroi
                    Object.keys(res.results).forEach( key => {
                        heros_list.innerHTML+=`<option value="${key}">${res.results[key]}</option>`;
                    })
                }
            }
        });
    }
   
}

function findHeros(){

    const checkCharacters = /^\w[a-z1-9-_.:,,?/&%$*() ]*$/i;
    let nameStart_hero = document.getElementById('hero_name').value;
    let loading = document.getElementById('loading');
    let loading_img = document.getElementById('loading_img');
    let loading_msg = document.getElementById('loading_msg');
    let heros_list = document.getElementById('heros_list');

    //Ogni volta che viene schiacciata la lente di ingrandimento, imposto l'immagine di loading
    //e nascondo il menu dei risultati
    loading_img.src="https://media.tenor.com/ZI5hpnSdQGkAAAAi/eternals-marvel-studios.gif";
    loading_msg.innerText="Loading...";
    loading.classList.remove('d-none');
    heros_list.classList.add('d-none');

    if(nameStart_hero!=null && nameStart_hero!=undefined && checkCharacters.test(nameStart_hero)){

        fetch(`http://localhost:3000/heros?nameStartWith=${nameStart_hero}`)
        .then(response => response.json())
        .then(res =>{

            if(res.error){
                loading_img.src="https://media.tenor.com/zQM6QTjo3FMAAAAi/ms-marvel-marvel-studios.gif"; //Immagine per ricerca fallita
                loading_msg.innerText=res.msg;

            } else{

                if(res.results.length<1){
                    loading_img.src="https://media.tenor.com/zQM6QTjo3FMAAAAi/ms-marvel-marvel-studios.gif";
                    loading_msg.innerText=res.innerText="Hero not found";

                } else{
                    loading.classList.add('d-none');
                    heros_list.classList.remove('d-none');

                    //Inizializzo la lista
                    heros_list.innerHTML='';

                    res.results.forEach(element => {
                        heros_list.innerHTML+=`<option value="${element}">${element}</option>`;
                    });
                }
            }
        });
    }
   
}

//Questa funzione seleziona un eroe
function chooseHero(){

    let heroButton = document.getElementById('hero_button');
    let selectMenu = document.getElementById('heros_list');
   
    heroButton.innerText = selectMenu.value;
    heroButton.name = selectMenu.value;
}

function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}