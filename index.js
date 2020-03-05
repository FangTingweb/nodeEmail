const superagent = require('superagent')
// 解析html
const cheerio = require('cheerio')

const express = require('express')
// 发邮件
const nodemailer = require('nodemailer')

// 模板引擎
const ejs = require('ejs')

// 定时器
const schedule = require('node-schedule')

let url = 'https://free-api.heweather.net/s6/weather/now'



// 获取当天天气
function getNowWeather(){
    return new Promise((resove, reject) => {
        superagent
        .get(url)
        .query({location:'CN101210114', key:'1178e9653df6492c8331bc187a888bc2'})
        .accept('application/json')
        .end((err, res) => {
            let text = JSON.parse(res.text)
            resove(text)
        })
    })
   
}

//获取图片及文字内容
function getImageAndText(){

    return new Promise((resove, reject) => {
        superagent
        .get("http://wufazhuce.com")
        .end((err, res) => {
            const $ = cheerio.load(res.text)
            let url = $('.fp-one-imagen').attr('src')
            let text = $('.fp-one-cita').eq(0).find('a').text()
            let obj  ={
                url:url,
                text: text
            }
            resove(obj)
        })
    })
    
}

// 路由

const app = express()
const port = 8888

//设置允许跨域访问该服务.
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json;charset=utf-8');
    next();
  });

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/picture', function (req, res) {
    getImageAndText().then(data => {
        res.send(data)
    })
})

app.get('/weather', function (req, res) {
    getNowWeather().then(data => {
        res.send(data)
    })
    
})

// app.listen(port, () => console.log('success'))

// html模板
// people = ['geddy', 'neil', 'alex'],
// html = ejs.render('<%= people.join(", "); %>', {people: people});
// console.log(html)

function sendEmail(){
    Promise.all([getNowWeather(),getImageAndText()]).then(res => {
        let data = {
            url:res[1].url,
            text:res[1].text,
            HeWeather6:res[0].HeWeather6
        }
        ejs.renderFile('ejs.ejs', data, {}, function(err, str){
            // 发送邮件
            var mailTransport = nodemailer.createTransport({
                host : 'smtp.qq.com',
                secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
                auth : {
                    user : '1466137805@qq.com',
                    pass : 'hehnlsmbpbjzffee'
                },
            });

            let  options = {
                    from        : '1466137805@qq.com',
                    to          : 'fangting3654@dingtalk.com',
                    subject     : '一封来自Node Mailer的邮件',
                    text        : '一封来自Node Mailer的邮件',
                    html        : str,
            };
            mailTransport.sendMail(options, function(err, msg){
                if(!err){
                    console.log('发送成功')
                }
                
            });
        });
    })
}


const  scheduleCronstyle = ()=>{
      //每分钟的第30秒定时执行一次:
        schedule.scheduleJob('30 * * * * *',()=>{
            console.log('scheduleCronstyle:' + new Date());
            sendEmail()
        }); 
    }
     scheduleCronstyle()

