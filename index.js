const express = require('express');
const app = express();
var bodyParser = require('body-parser')
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(urlencodedParser);

// create application/json parser
var jsonParser = bodyParser.json()

const mysql = require('mysql');

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
        user: '6983299@qq.com',
        pass: process.env.MAIL_PWD
    }
});



const pagesize = 15;

const cors = require('cors');
app.use(cors());


var con = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "vvvv",
    multipleStatements: true
});
// var con = mysql.createPool({
//     host: "207.154.246.219",
//     user: "well-informed-knife-ned",
//     password: process.env.DB_PWD,
//     database: "well_informed_knife_ned_db",
//     multipleStatements: true
// });


app.get("/", async function(request, response) {
    response.json("Live");
});


app.post('/booksbycat/total', jsonParser,async function (request, response) {
    let sql = "SELECT count(*) total FROM fvvv " + request.body.cat;

    con.query(sql, function (err, result, fields) {
        if (err) throw err;
        //console.log(parseInt(result[0]['total']/pagesize));
        response.json(parseInt(result[0]['total']/pagesize));
    });
});

//分页
app.post('/booksbycat/:page', jsonParser, async function (request, response) {
    //let pagesize = 5;
    let pagenumber = request.params.page;

    let offset = pagesize*(pagenumber-1);
    let sql = "SELECT * FROM fvvv " + request.body.cat +  " order by id desc limit " + pagesize.toString() +  " OFFSET " + offset.toString();

    //console.log(sql);
    con.query(sql, function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });

});

app.post('/getproductsbyids', jsonParser, async function (request, response) {
    let sql = "select * from fvvv where id in (?)";
    console.log(request.body.vids);
    con.query(sql, [request.body.vids], function (err, result, fields) {
        if (err) throw err;
        //console.log(result);
        response.json(result);
    });
});

app.post('/getsdatabyids', jsonParser, async function (request, response) {
    let sql = "select * from sdata where vid in (?)";
    console.log(request.body.vids);
    con.query(sql, [request.body.vids], function (err, result, fields) {
        if (err) throw err;
        //console.log(result);
        response.json(result);
    });
});



//详情页：推荐
app.post('/recommend', jsonParser, async function (request, response) {

    let sql = "SELECT * FROM fvvv where id !=? ORDER BY rand() limit 5";
    //console.log(sql);
    con.query(sql, [request.body.vid], function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });

});

function getClientIp(req) {
    var ipAddress;
    var forwardedIpsStr = req.headers['X-Forwarded-For'];//判断是否有反向代理头信息
    if (forwardedIpsStr) {//如果有，则将头信息中第一个地址拿出，该地址就是真实的客户端IP；
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {//如果没有直接获取IP；
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
};

app.post('/putmcomments', jsonParser, async function (request, response) {
    let sql = "insert into msg(vid,uid,content) values(?,?,?)";
    console.log(sql);
    con.query(sql, [request.body.vid, getClientIp(request), request.body.content], function (err, result, fields) {
        if (err) throw err;
        console.log("Done");
        response.json(result);
    });
});

app.post('/getcomments', jsonParser, async function (request, response) {
    let sql = "select * from msg where vid=? order by id desc";
    //console.log(sql);
    con.query(sql, [request.body.vid], function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });
});

app.post('/getsdata', jsonParser, async function (request, response) {
    let sql = "select * from sdata where vid=?";
    //console.log(sql);
    con.query(sql, [request.body.vid], function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });
});

app.post("/putview", jsonParser, function(req, res) {
    const vid = req.body.vid;
    con.query("INSERT into sdata(vid,vw) values(?,1) on DUPLICATE KEY UPDATE vw = vw + 1", [Number(vid)], function (err, result, fields) {
        if (err) throw err;
        //console.log(result);
        res.json({ret:1});
    });
});

app.post("/putlike", jsonParser, function(req, res) {
    const vid = req.body.vid;
    con.query("INSERT into sdata(vid,lk) values(?,1) on DUPLICATE KEY UPDATE lk = lk + 1", [Number(vid)], function (err, result, fields) {
        if (err) throw err;
        //console.log(result);
        res.json({ret:1});
    });
});

app.post("/putdlike", jsonParser, function(req, res) {
    const vid = req.body.vid;
    con.query("INSERT into sdata(vid,dlike) values(?,1) on DUPLICATE KEY UPDATE dlike = dlike + 1", [vid], function (err, result, fields) {
        if (err) throw err;
        //console.log(result);
        res.json({ret:1});
    });
});


//详情
app.get('/book/:id', async function(request, response) {
    let id = request.params.id;
    con.query("select * from fvvv where id=" + id, function (err, result, fields) {
        if (err) {
            console.log(err);
        };
        response.json(result);
    });
});


function sendmail(to, subject, htmlContent) {
    var mailOptions = {
        from: '6983299@qq.com',
        to: to,
        subject: subject,
        html: htmlContent
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


app.listen(process.env.PORT,() => console.log(('listening :)')))