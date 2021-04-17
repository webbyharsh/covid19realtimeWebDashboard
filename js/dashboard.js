
$(async function(){
    
    const ele_temperature = $("#ele_temperature");
    const ele_progress_temperature = $("#ele_progress_temperature");
    const ele_progress_spo2 = $("#ele_progress_spo2");
    const ele_progress_heartrate = $("#ele_progress_heartrate");
    const ele_progress_update = $("#ele_progress_update");
    const ele_heartrate = $("#ele_heartrate");
    const ele_spo2 = $("#ele_spo2");
    const ele_healthindex = $("#ele_healthindex");
    const ele_lastupdate = $("#ele_lastupdate");
    const ele_username = $("#ele_username");
    const ele_spinner = $("#ele_spinner");
    const ele_datepicker = $("#ele_datepicker");
    const ele_linechart1 = $("#lineChart1");
    const ele_linechart2 = $("#lineChart2");
    const ele_temperature_mean = $("#ele_temperature_mean");
    const ele_bpm_mean = $("#ele_bpm_mean");
    const ele_spo2_mean = $("#ele_spo2_mean");
    const ele_stats_mean_title = $("#ele_stats_mean_title");
    
    let statiscal_data_for_the_day = {};
    
    let today = new Date();
    ele_datepicker.attr("min", "2021-01-01");
    ele_datepicker.attr("max", getDate(today));
    ele_datepicker.attr("value", getDate(today));
    let interval;

    
    const health_indexes = ["A+", "A", "B", "B+"];
    const db = firebase.firestore();
    const userName = "HarshYelne";

    Chart.defaults.global.defaultFontColor = '#75787c';


    let res = await getLatestUserHealthData(userName);
    setDashboardData(res);
    let todayMillis = (new Date(getDate(today))).getTime().toString();
    //console.log(todayMillis);
    await renderChart(ele_linechart2, '/firestore/getToday/30/HarshYelne/'+todayMillis, 'Data on date - ' + today.toLocaleDateString(), today);

    $("#ele_takedate").click( async() =>{
        let date = new Date(ele_datepicker.val());
        let dateMillis = (date.getTime()).toString();
        await renderChart(ele_linechart2, '/firestore/getToday/30/HarshYelne/'+dateMillis, 'Data on date - ' + date.toDateString(), date);
    });

    ele_username.text("COVID19 realtime dashboard for " + userName);
    ele_spinner.removeClass("spinner-border");

    //await setDailyDashboardChart();
    await renderChart(ele_linechart1, '/firestore/getLast/20/HarshYelne', 'Last 20 readings obtained', null);

    //REALTIME UPDATE FEATURE
    db.collection("covid19_health").doc(userName).collection("health_data").orderBy("datetime", "desc").limit(1)
        .onSnapshot((querySnapshot) => {
            //console.log(querySnapshot.data());
            querySnapshot.docChanges().forEach((change) =>{
                //console.log(change.doc.data());
                if(change.type === 'added'){
                    //console.log(change.doc.data());
                    //console.log(change.doc.data());
                    //console.log(getTimePassed(change.doc.data().datetime.seconds*1000));
                    // if(querySnapshot.docChanges().length == 1){
                    //     setDashboardData(change.doc.data());
                    // }
                    //let millis = change.doc.data().datetime.seconds.
                    setDashboardData(change.doc.data());
                }
            });
        })
    //REALTIME UPDATE FEATURE




    // DEFAULT UPDATE after 2 min

    // setInterval(()=>{
    //     let res = await getLatestUserHealthData("HarshYelne");
    //     setDashboardData(res);
    // }, 120000); //default process update every 2 min.

    //DEFAULT AUTO UPDATE AFTER 2 min. 

    //FOR FIRST TIME LOADING
    async function getLatestUserHealthData(userName){
        //const userName = "HarshYelne";
        return new Promise(async (resolve, reject) =>{
            const protocol = "https";
            const host = "enigmatic-cove-56775.herokuapp.com/";
            const query = "firestore/getUser/" + userName;
            const date = new Date();
            let response = {};
            let recent_time = 0;
            try {
                await $.get(protocol+"://"+host+query, (data, status) =>{
                    let health_data_arr = data.health_data;
                    setHealthIndex(health_data_arr); // To calculate healthIndex using some statistical formula.
                    let times_arr = health_data_arr.map((data) =>{
                        if(data.datetime._seconds*1000 >= recent_time){
                            recent_time = data.datetime._seconds*1000;
                            response = data;
                        }
                    })
                });
            } catch (err) {
                console.log(err);
                reject(err);
            }finally{
                resolve(response);
            }
        })
    }

    //FOR FIRST TIME LOADING


    //NOT USABLE AS OF SECOND PROJECT EVAL
    function setHealthIndex(data){
        console.log(data);
        let n = data.length;
        let avg_temp=0;
        let avg_spo2=0;
        let avg_hr=0;
        for(let i=0;i<n;i++){
            avg_temp = avg_temp + data[i].temperature;
            avg_spo2 = avg_spo2 + data[i].spo2;
            avg_hr = avg_hr + data[i].heartRate;
        }
        avg_temp /= n;
        avg_spo2 /= n;
        avg_hr /= n;
        let ts=0;
        let hs=0;
        let ss=0;
        if(avg_temp >= 97.5 && avg_temp <= 99.5){

        }
        let health_score = 0.5*avg_spo2 + 0.35*avg_temp + 0.15*avg_hr;
        console.log(health_score);
        ele_healthindex.text(data.healthIndex);
    }    


    function setDashboardData(data){
        ele_temperature.text(data.temperature);
        ele_heartrate.text(data.heartRate);
        ele_spo2.text(data.spo2);
        let time = getTimePassed(data.datetime._seconds*1000 || data.datetime.seconds*1000);
        //console.log(time[0]);
        if(time[0] <= 0){
            ele_lastupdate.text("NOW");
        }else{
            ele_lastupdate.text(time[0] + " " + time[1]);
            //console.log(time[0]);
            //console.log(time[1]);
        }
        let ele_progress_temperature_val = data.temperature*(-25/2) + 1325 //y = -12.5x + 1325
        let ele_progress_heartrate_val = data.heartRate*(-0.5) + 130  // y = -0.5x+130
        let ele_progress_spo2_val = data.spo2*(7) - 600; // y = 7x-600;
        let ele_progress_update_val = 100;

        if(data.heartRate <= 40 || data.heartRate >= 150){
            ele_progress_heartrate_val = 20;
        }
        if(data.spo2 <= 85){
            ele_progress_spo2_val = 10;
        }
        if(data.temperature <= 93 || data.temperature >= 105){
            ele_progress_temperature_val = 20;
        }

        if(time[1] == 'sec'){
            ele_progress_update_val = 100;
        }else if(time[1] == 'min'){
            ele_progress_update_val = 80;

        }else if(time[1] == 'hr'){
            ele_progress_update_val = 60;

        }else if(time[1] == 'D'){
            ele_progress_update_val = 40;

        }else{
            ele_progress_update_val = 20;

        }
        
        ele_progress_temperature.attr("style", "width:" + ele_progress_temperature_val + "%");
        ele_progress_heartrate.attr("style", "width:" + ele_progress_heartrate_val + "%");
        ele_progress_spo2.attr("style", "width:" + ele_progress_spo2_val + "%");
        ele_progress_update.attr("style", "width:" + ele_progress_update_val + "%");

    }

    //query to be started with / and ended with /
    async function renderChart(canvasElement, query, title, dateObj){
        const protocol = "https";
        const host = "enigmatic-cove-56775.herokuapp.com";
        //const query = "firestore/getLast/20/" + userName;
        let temperature = [];
        let spo2 = [];
        let heartrate = [];
        let datetime = [];

        let data = await $.get(protocol+"://"+host+query , (data, status) =>{
            let arr = data.health_data;
            statistical_data_for_the_day = data.stats;
            if(typeof(data.stats)!='undefined'){
                if(!Object.keys(data.stats).length == 0 ){
                    setStatisticalDataForDay(data.stats, dateObj);  //to set preview data (only mean)
                }
            }
            arr.map((doc) =>{
                temperature.push(doc.temperature);
                spo2.push(doc.spo2);
                heartrate.push(doc.heartRate);
                let t = new Date(doc.datetime);
                datetime.push(t.toLocaleTimeString());
            });
        });

        if(temperature.length == 0 || spo2.length == 0 || heartrate.length == 0 ){
            temperature.push(0);
            spo2.push(0);
            heartrate.push(0);
            datetime.push(0);
            title = "(Errror while rendering)No data for this day !! " + (new Date(ele_datepicker.val())).toDateString();
        }
        temperature.reverse();
        spo2.reverse();
        heartrate.reverse();
        datetime.reverse();

        let LINECHART = canvasElement;
        //MAKING CHART 
        let myLineChart = new Chart(LINECHART, {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio:false,
                scales: {
                    xAxes: [{
                        display: true,
                        gridLines: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            max: 105,
                            min: 75,
                            stepSize: 5
                        },
                        display: true,
                        gridLines: {
                            display: false
                        }
                    }]
                },
                legend: {
                    display: true
                },
                title: {
                    display: true,
                    fontSize: 15,
                    text: title
                }
                
            },
            data: {
                //labels: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "L", "M", "N", "O", "P", "Q", "R", "S", "T"],
                labels: datetime,
                datasets: [
                    {
                        label: "Temperature",
                        fill: true,
                        lineTension: 0.3,
                        backgroundColor: "transparent",
                        borderColor: '#EF8C99',
                        pointBorderColor: '#EF8C99',
                        pointHoverBackgroundColor: '#EF8C99',
                        borderCapStyle: 'butt',
                        borderDash: [],
                        borderDashOffset: 0.0,
                        borderJoinStyle: 'miter',
                        borderWidth: 2,
                        pointBackgroundColor: "#EF8C99",
                        pointBorderWidth: 2,
                        pointHoverRadius: 4,
                        pointHoverBorderColor: "#fff",
                        pointHoverBorderWidth: 0,
                        pointRadius: 1,
                        pointHitRadius: 0,
                        //data: [20, 21, 25, 22, 24, 18, 20, 23, 19, 22, 25, 19, 24, 27, 22, 17, 20, 17, 20, 26, 22],
                        data: temperature,
                        spanGaps: false
                    },
                    {
                        label: "BPM",
                        fill: true,
                        lineTension: 0.3,
                        backgroundColor: "transparent",
                        borderColor: 'rgba(238, 139, 152, 0.35)',
                        pointBorderColor: 'rgba(238, 139, 152, 0.35)',
                        pointHoverBackgroundColor: 'rgba(238, 139, 152, 0.35)',
                        borderCapStyle: 'butt',
                        borderDash: [],
                        borderDashOffset: 0.0,
                        borderJoinStyle: 'miter',
                        borderWidth: 2,
                        pointBackgroundColor: "rgba(238, 139, 152, 0.24)",
                        pointBorderWidth: 2,
                        pointHoverRadius: 4,
                        pointHoverBorderColor: "#fff",
                        pointHoverBorderWidth: 0,
                        pointRadius: 1,
                        pointHitRadius: 0,
                        data: heartrate,
                        spanGaps: false
                    },
                    {
                        label: "% of spo2",
                        fill: true,
                        lineTension: 0.3,
                        backgroundColor: "transparent",
                        borderColor: '#800080',
                        pointBorderColor: '#800080',
                        pointHoverBackgroundColor: '#800080',
                        borderCapStyle: 'butt',
                        borderDash: [],
                        borderDashOffset: 0.0,
                        borderJoinStyle: 'miter',
                        borderWidth: 2,
                        pointBackgroundColor: "#800080",
                        pointBorderWidth: 2,
                        pointHoverRadius: 4,
                        pointHoverBorderColor: "#fff",
                        pointHoverBorderWidth: 0,
                        pointRadius: 1,
                        pointHitRadius: 0,
                        data: spo2,
                        spanGaps: false
                    }
                ]
            }
        });
    }

    function setStatisticalDataForDay(data, dateObj){
        //setting preview data i.e Data that shows only mean in the front page 
        ele_temperature_mean.text(data.te.te_mean.toPrecision(3));
        ele_bpm_mean.text(data.hr.hr_mean.toPrecision(3));
        ele_spo2_mean.text(data.sp.sp_mean.toPrecision(3));
        ele_stats_mean_title.text("Mean on " + getDate(dateObj));
    }

});



function getTimePassed(date_string){
    var date1=new Date(date_string);
    var unit="";
    var date2=new Date();
    var d1=date1.getTime();
    var d2=date2.getTime();
    var diff=d2-d1;
    if(diff<=60*1000){
        unit="sec";
        diff=diff/1000;
    }
    else if(diff<=60*60*1000){
        unit="min";
        diff=diff/(60*1000);
    }
    else if(diff<=3600*1000*24){
        unit="hr";
        diff=diff/(3600*1000);
    }
    else if(diff<=7*1000*3600*24){
        unit="D";
        diff=diff/(1000*24*3600);
    }
    else if(diff<=31*1000*3600*24){
        unit="weeks";
        diff=diff/(7*1000*3600*24);
    }
    else if(diff<=3600*1000*365*24){
        unit="months";
        diff=diff/(1000*3600*24*31);
    }
    else if(diff>3600*1000*365*24){
        unit="years";
        diff=diff/(1000*3600*24*365);
    }
    // if(unit == "sec"){
    //     return [diff.toPrecision(2),unit];    
    // }else {
    //     return [diff.toPrecision(1),unit];
    // }
    diff = Math.floor(diff);
    return [diff, unit];
}

function getDate(today){

    return padNumber(today.getUTCFullYear()) + "-" + padNumber(today.getUTCMonth() + 1) + "-" + padNumber(today.getUTCDate())

}

function padNumber(n){
    if(n<10){
        return "0"+n.toString();
    }else{
        return n.toString();
    }
}