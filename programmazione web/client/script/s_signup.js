
function checkFirstName(){

    const checkName = /^[a-z]+ ?[a-z ]*$/i;
    let name = document.getElementById("firstName");
    let label = document.getElementById("l_firstName");

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

function checkLastName(){

    const checkLastName = /^[a-z]+ ?[a-z ]*$/i;
    let lastName = document.getElementById("lastName");
    let label = document.getElementById("l_lastName");

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

function checkUsername(){

   const checkUsername = /^[a-z0-9_-]{3,15}$/i;

   let username = document.getElementById("username");
   let label = document.getElementById("l_username");

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

function checkEmail(){

    const checkEmail = 	/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let email = document.getElementById("email");
    let label = document.getElementById("l_email");
  
    if(checkEmail.test(email.value)){
        email.classList.remove("border");
        email.classList.remove("border-3");
        email.classList.remove("border-danger");
        label.classList.remove("text-danger");
        label.innerText="Email address";
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

//Nella funzione checkVerifyEmail non faccio un controllo con regex perché deve essere  uguale all'email
//inserita in precedenza. L'email inserita in precedenza dovrà comunque rispettare le regole della regex
function checkVerifyEmail(){

    let email = document.getElementById("email");
    let verifyEmail = document.getElementById("verifyEmail");
    let label = document.getElementById("l_verifyEmail");

    if(verifyEmail.value === email.value){
        verifyEmail.classList.remove("border");
        verifyEmail.classList.remove("border-3");
        verifyEmail.classList.remove("border-danger");
        label.classList.remove("text-danger");
        label.innerText="Verify email address";
        return true;
    }else{
        verifyEmail.classList.add("border");
        verifyEmail.classList.add("border-3");
        verifyEmail.classList.add("border-danger");
        label.classList.add("text-danger");
        label.innerText="Emails doesn't match";
        return false;
    }
}

function checkPassword(){

    const checkPassword = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    let password = document.getElementById("password");
    let label = document.getElementById("l_password");

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

//Nella funzione checkVerifyPassword applico la stessa logica della funzione checkVerifyEmail
function checkVerifyPassword(){

    let password = document.getElementById("password");
    let verifyPassword = document.getElementById("verifyPassword");
    let label = document.getElementById("l_verifyPassword");

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

function checkHero(){

    const checkHero = /[1-9a-z-_!$&()][1-9a-z-_!$&() ]*$/i;
    let hero = document.getElementById("hero_button"); 
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

function sendForm(){
    if(checkFirstName())
        if(checkLastName())
            if( checkUsername())
                if(checkEmail())
                    if(checkVerifyEmail())
                        if(checkPassword())
                            if(checkHero())
                                signup();
}

function signup(){

    let waiting_window = document.getElementById('waiting');

    waiting_window.classList.remove('d-none');
    document.getElementById("menu").classList.add("z-1");

    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ //Il campo profileImage verrà aggiunto dal backend, questo perchè bisognerà fare una chiamata alle api di marvel
            firstName : document.getElementById("firstName").value,
            lastName: document.getElementById("lastName").value,
            username: document.getElementById("username").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            hero: document.getElementById("hero_button").name,
            credits:0,
            creditCard:{
                nameHolder: null,
                surnameHolder: null,
                number:null,
                type: null,
                expireDate: null,
                cvv: null
            },
            signupDate: new Date().toISOString().slice(0, 10)
        })
    }

    fetch("http://localhost:3000/user",options)
    .then(response =>response.json())
    .then(data => {
        
        waiting_window.classList.add('d-none');

            if(data.error){
                document.getElementById("window").classList.remove("d-none");

                let list = document.getElementById("msg_list");
               
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });
            }
            else{
        
                localStorage.setItem('uid', data.uid);
                window.location.href="./album.html";
             
            }
        
        }
    );
    
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

