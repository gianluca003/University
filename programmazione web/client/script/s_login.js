
//Eseguo dei controlli preliminari per capire se i due input siano validi o no, in questo
//modo evito chiamate superflue
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
         label.innerText="Invalid username";
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
        label.innerText="Invalid password";
        return false;
    }
    
}

function sendForm(){
    if(checkUsername())
        if(checkPassword())
            login();
}

function login(){

    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        })
    }

    fetch("http://localhost:3000/login",options)
    .then(response =>response.json())
    .then(data => {
        
            if(data.error){
                document.getElementById("window").classList.remove("d-none");
                let list = document.getElementById("msg_list");

                document.getElementById("menu-basic").classList.add("z-1");
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });
            }
            else{
           
               localStorage.setItem('uid', data.uid);

                //Se admin è settato a true passo nella pagina admin.html, in cui verrà fatto
                //un controllo per capire se l'uid è effettivamente associato ad un ruolo
                //di admin
                if(data.admin)
                    window.location.href="./admin.html";
                else
                  window.location.href="./album.html";
             
            }
        
        }
    );
}