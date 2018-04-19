import { URL } from './AppConsts';

function buscarDados(params) {

  const options = 
  {
    ipbase: document.getElementById('frmIPBase').value,
    instancia: document.getElementById('frmInstanciaBase').value,
    alias: document.getElementById('frmAliasBase').value,
    tabela: params.tabela,
    filtro: params.filtro,
    ordem: params.ordem
  };

  let dados = [];
  let obj = params.this;

  obj.setState({loading: "spokes"});

  fetch(URL, {
    body: JSON.stringify(options), 
    cache: 'no-cache', 
    credentials: 'same-origin', 
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST', 
    mode: 'cors', 
    redirect: 'follow', 
    referrer: 'no-referrer', 
  })
  .then(response => response.json())
  .then(function(data) {

    obj.setState({loading: "blank"});

    if (data.code === "ETIMEOUT") {
      alert("Falha na conexão: " + data.message);
      return;
    }

    if (data.length === 0) {
      alert("Não há registros para a consulta da tabela: " + params.tabela)
      return;
    };

    dados.push(data);

    if (params.adicionarObjeto){
      dados[0].splice(0, 0, params.adicionarObjeto);
    }

    params.callback(dados[0]);
  });
}

export { buscarDados };