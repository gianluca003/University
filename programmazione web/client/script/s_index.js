function setHomepage(){
    setMenu();
    getPosts();
}

function setMenu(){
    if(localStorage.getItem("uid") != null && localStorage.getItem("uid") != undefined){
        document.getElementById("menu-basic").classList.add("d-none");
        document.getElementById("menu").classList.remove("d-none");
        document.getElementById("basic_footer").classList.add("d-none");
        document.getElementById("footer").classList.remove("d-none");
    }
}

function getPosts(){
    
    let post_one = document.getElementById("post_one");
    let post_two = document.getElementById("post_two");
    let title_one = document.getElementById("title_one");
    let title_two = document.getElementById("title_two");
    let article_one = document.getElementById("description_one");
    let article_two = document.getElementById("description_two");

    fetch("http://localhost:3000/post")
    .then(response => response.json())
    .then(data => {

        //ordino i post che mi arrivano in base al numero degli indici (es. post uno = index:1)
        data.sort((a,b) => a.index<b.index?-1:1 );

        post_one.src = data[0].url;
        title_one.innerText = data[0].title;
        article_one.innerText = data[0].description;

        post_two.src = data[1].url;
        title_two.innerText = data[1].title;
        article_two.innerText = data[1].description;
    });

}


function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}

