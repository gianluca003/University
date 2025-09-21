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

    let query = window.location.search;
    let param = new URLSearchParams(query);
    const hero_id = param.get('hero');
    let waiting_window = document.getElementById('waiting');
    let comics = document.getElementById('comics');
    let series = document.getElementById('series');
    let events = document.getElementById('events');
    let stories = document.getElementById('stories');

    if(!authAccess()){
        logout();

    } else{

        document.getElementById("menu").classList.add("z-1");
        waiting_window.classList.remove("d-none");

        fetch(`http://localhost:3000/details/${hero_id}/${uidUser}`)
        .then(response => response.json())
        .then(data =>{

            waiting_window.classList.add('d-none');

            if(data.error){
                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                let list = document.getElementById("msg_list");

               
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else{

                document.getElementById('image').src = data.informations.image;
                document.getElementById('name').innerText=data.informations.name;
                document.getElementById('description').innerText=data.informations.description;
                document.getElementById('rarity').innerText=data.informations.rarity;
                document.getElementById('quantity').innerText=data.informations.quantity;
                document.getElementById('index').innerText=data.informations.index;

                comics.innerHTML = '';

                data.informations.comics.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    comics.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center" href='./comics.html?comic=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

                series.innerHTML = '';

                data.informations.series.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    series.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center" href='./series.html?serie=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

                stories.innerHTML = '';

                data.informations.stories.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    stories.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center" href='./stories.html?story=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

                events.innerHTML = '';

                data.informations.events.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    events.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center"  href='./events.html?event=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

            }

        });
    }
}


function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}