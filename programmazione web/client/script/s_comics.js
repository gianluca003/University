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
    const comic_id = param.get('comic');
    let waiting_window = document.getElementById('waiting');
    let d;
    let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let stories = document.getElementById('stories');
    let events = document.getElementById('events');
    let characters = document.getElementById('characters');


    if(!authAccess()){
        logout();

    } else{
        
        document.getElementById("menu").classList.add("z-1");
        waiting_window.classList.remove("d-none");

        fetch(`http://localhost:3000/comics/${comic_id}`)
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

                document.getElementById('image').src=data.informations.image;
                document.getElementById('title').innerText=data.informations.title;
                document.getElementById('description').innerText=data.informations.description;

                document.getElementById('creators').innerText='';

                for(let i=0; i<data.informations.creators.length;i++){
                    document.getElementById('creators').innerText+=data.informations.creators[i].name+` (${data.informations.creators[i].role})`;

                    if(i!=data.informations.creators.length-1)
                        document.getElementById('creators').innerHTML+=',&nbsp';
                }

                document.getElementById('format').innerText=data.informations.format;
                document.getElementById('pageCount').innerText=data.informations.pageCount;

                data.informations.dates.forEach(date => {
                    if(date.type=="onsaleDate"){
                        d=new Date(date.date)
                        document.getElementById('date').innerText=d.getDate()+" "+months[d.getMonth()]+" "+d.getFullYear();
                    }
                        
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

                characters.innerHTML='';

                data.informations.characters.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    characters.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center"  href='./details.html?hero=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

            }
        });
    }
}


function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}