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
        pass: 'zduhlnaprqymbjgd'
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
//     host: "104.236.24.119",
//     user: "strange-necessary-hiv",
//     password: "Oq4gW7F2yLo63Sc)_(",
//     database: "strange_necessary_hiv_db",
//     multipleStatements: true
// });


app.get("/", async function(request, response) {
    response.json("Live");
});


//最新，最热
app.get('/books', async function (request, response) {
    con.query("SELECT * FROM books order by id desc limit 30", function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });

});

app.get('/bookshot', async function (request, response) {
    con.query("select b.*, d.vw_init+d.vw vw, d.dl_init+d.dl dl, d.score from docdata d inner join books b on d.zyid = b.id order by d.vw desc limit 6", function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });

});

//根据tag获取最热书籍排行
app.post('/bookshots', async function (request, response) {
    con.query("select b.*, d.vw_init+d.vw vw, d.dl_init+d.dl dl, d.score from docdata d " +
        "inner join (select id,catagory,site,token,title,cover_img,pdf_size,epub_size,mobi_size from books where order_hot is not null) b" +
        " on d.zyid = b.id", function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });
});


app.post('/booksbycat/total', jsonParser,async function (request, response) {
    let sql = "SELECT count(*) total FROM fvvv where title like '%" + request.body.cat + "%'";

    if(request.body.cat.toLowerCase() === "hot") {
        sql = "SELECT count(*) total FROM fvvv where (title like '%女神%' or title like '%美女%' or title like '%极品%') and (title like '%干%' or  title like '%操%')";
    }

    if(request.body.cat.toLowerCase() === "潮喷") {
        sql = "SELECT count(*) total FROM fvvv where where title like '%潮喷%' or title like '%高潮%'";
    }

    if(request.body.cat.toLowerCase() === "所有") {
        sql = "SELECT count(*) total FROM fvvv";
    }

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
    let sql = "SELECT * FROM fvvv where title like '%" + request.body.cat +  "%' order by id desc limit " + pagesize.toString() +  " OFFSET " + offset.toString();

    if(request.body.cat.toLowerCase() === "hot") {
        sql = "SELECT * FROM fvvv where (title like '%女神%' or title like '%美女%' or title like '%极品%') and (title like '%干%' or  title like '%操%') order by id desc limit " + pagesize.toString() +  " OFFSET " + offset.toString();
    }

    if(request.body.cat.toLowerCase() === "潮喷") {
        sql = "SELECT * FROM fvvv where title like '%潮喷%' or title like '%高潮%' order by id desc limit " + pagesize.toString() +  " OFFSET " + offset.toString();
    }

    if(request.body.cat.toLowerCase() === "所有") {
        sql = "SELECT * FROM fvvv order by id desc limit " + pagesize.toString() +  " OFFSET " + offset.toString();
    }

    //console.log(sql);
    con.query(sql, function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });

});

app.post('/getsdatabyids', jsonParser, async function (request, response) {
    let sql = "select * from sdata where vid in (?)";
    console.log(request.body.vids.toString());
    con.query(sql, [request.body.vids], function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        response.json(result);
    });
});



//详情页：推荐
app.post('/recommend', jsonParser, async function (request, response) {
    //let pagesize = 5;

    let sql = "SELECT * FROM fvvv where title not like '%" + request.body.cat +  "%' ORDER BY rand() limit 5";
    //console.log(sql);
    con.query(sql, function (err, result, fields) {
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


app.get('/books/total', async function (request, response) {
    con.query("SELECT count(*) total FROM books", function (err, result, fields) {
        if (err) throw err;
        //console.log(parseInt(result[0]['total']/pagesize));
        response.json(parseInt(result[0]['total']/pagesize));
    });
});

//分页
app.get('/books/:page', async function (request, response) {
	//let pagesize = 5;
	let pagenumber = request.params.page;

	offset = pagesize*(pagenumber-1);

    con.query("SELECT * FROM books order by id desc limit " + pagesize + " OFFSET " + offset , function (err, result, fields) {
        if (err) throw err;
        response.json(result);
    });

});

app.post('/docdata', jsonParser, async function (request, response) {
    const zyids = request.body.zyids;
    console.log(zyids.toString());
    con.query("SELECT zyid, vw_init+vw vw, dl_init+dl dl, score FROM docdata where zyid in (?)", [zyids], function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        response.json(result);
    });
});



app.post("/userview", jsonParser, function(req, res) {
    const zyid = req.body.zyid;
    con.query("INSERT into docdata(zyid,vw) values(?,1) on DUPLICATE KEY UPDATE vw = vw + 1", [zyid.toString()], function (err, result, fields) {
        if (err) throw err;
        //console.log(result);
        res.json({ret:1});
    });
});
app.post("/usermark", jsonParser, function(req, res) {
    const zyid = req.body.zyid;
    const score = req.body.score;
    con.query("INSERT into docdata(zyid,sr) values(?,1) on DUPLICATE KEY UPDATE sr = sr + 1;INSERT into docdata(zyid,score) values(?,?) on DUPLICATE KEY UPDATE score = (score + ?)/2;", [zyid, zyid, score, score], function (err, result, fields) {
        if (err) throw err;
        //console.log(result);
        res.json({ret:1});
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