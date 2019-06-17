var stringify = require('json-stringify');
var sql = require('mssql');
var exp = require('express');
var bodyParser = require('body-parser');
var app = exp();
// var processPath = require('./transformLogJson');

app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', true);
    next();
});

function consultarDados(param, callback, error) {
    sql
        .connect(param.cfgBaseDados)
        .then(function () {
            var sqlTxt = '';
            if (param.projecao !== undefined) 
                sqlTxt += 'select ' + param.projecao;
            
            if (param.tabela !== undefined) {
                if (sqlTxt == '') 
                    sqlTxt = 'select * from ' + param.tabela
                else 
                    sqlTxt += ' from ' + param.tabela;
                }
            ;

            if (param.filtro !== undefined) {
                sqlTxt += ' where ' + param.filtro;
            };

            if (param.ordem !== undefined) {
                sqlTxt += ' order by ' + param.ordem;
            }

            var request = new sql.Request();
            console.log("SQL: " + sqlTxt);
            request.query(sqlTxt, function (err, recordset) {
                if (err) {
                    param.ok = false;
                    param.data = err;
                    error(param);
                    sql.close();
                    return;
                };
                param.ok = true;
                param.data = recordset;
                sql.close();
                callback(param);
            });

        })
        .catch(function (err) {
            param.ok = false;
            param.data = err;
            sql.close();
            error(param);
        });
};

app
    .route('/dados')
    .post(function (req, res) {
        var ipBaseDePesquisa = req.body.ipbase;
        var instancia = req.body.instancia;
        var aliasBaseDePesquisa = req.body.alias;
        var tabela = req.body.tabela;
        var filtro = req.body.filtro;
        var ordem = req.body.ordem;
        var projecao = req.body.projecao;

        if (projecao === undefined || projecao === "") 
            projecao = "*";
        
        var configBaseDeDados = {
            user: 'saj',
            password: 'agesune1',
            server: ipBaseDePesquisa + "\\" + instancia,
            database: aliasBaseDePesquisa,
            parseJSON: true
        };

        function success(param) {
            res.json(param.data)
        };

        function error(param) {
            console.log(param);
            res.json(param.data)
        };

        var param = {
            cfgBaseDados: configBaseDeDados,
            projecao: projecao,
            tabela: tabela,
            filtro: filtro,
            ordem: ordem
        };

        consultarDados(param, success, error);
    });

app
    .route('/processLogPath')
    .get(function (req, res) {
        var path = req.query.path;
        console.log(req.query);
        processPath.loadDirectory(path);
    });

var port = 8486;

app.listen(port, function () {
    console.log('Connection on ' + port);
});
