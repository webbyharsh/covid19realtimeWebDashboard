$(async function(){
    console.log("TEST SCRIPT STARTED");
    setInterval(()=>{
        let temperature = getRandomArbitrary(97, 98);
        temperature = temperature.toPrecision(2);
        let heartRate = Math.floor(getRandomArbitrary(75, 95));
        let spo2 = Math.floor(getRandomArbitrary(96,99));
        $.post("https://enigmatic-cove-56775.herokuapp.com/firestore/writeUser/HarshYelne",{
            temperature: temperature,
            heartRate: heartRate,
            spo2: spo2
        }, (data, status)=>{
            console.log(data);
            console.log(status);
        })
    }, 5000)



});
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }