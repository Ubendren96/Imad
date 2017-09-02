//submit username/password
var submit = document.getElementById('submit_btn');
submit.onclick=function(){
    
    var request = new XMLHttpRequest();
    
    //capture the response and store it into the varible
    request.onreadystatechange = function(){
        if(request.readyState == XMLHttpRequest.DONE) {
            //Take some action
            if(request.status ==200 ){
                console.log('user logged successfully');
                alert('logged in successfully');
            }else if(request.status == 403){
                alert('Username/password is incorrect');
            }else{
                alert('Something went wrong on the server');
            }
        }
    };

    var username=document.getElementById('username').value;
    var password=document.getElementById('password').value;
    console.log(username);
    console.log(password);

    //Make the request
    request.open('POST','http://ubendren96.imad.hasura-app.io/login');
    request.setRequestHeader('Content-Type','application/json');
    request.send(JSON.stringify({username: username,password: password}));
    
    
};