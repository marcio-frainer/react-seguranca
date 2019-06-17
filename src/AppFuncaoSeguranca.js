import React, { Component } from 'react';
import logo from './imagens/logo.png';
import './App.css';
import { Glyphicon, Row, ButtonGroup, Button, Panel, Col, Form, FormGroup, ControlLabel, FormControl, Checkbox } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Cookies } from 'react-cookie';
import ReactLoading from 'react-loading';
import { BaseCard } from 'simple-react-card';
import { buscarDados } from "./AppFunctions";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppVersao } from './AppConsts';
import { confirmAlert } from 'react-confirm-alert'; 
import 'react-confirm-alert/src/react-confirm-alert.css'; 

const cookies = new Cookies();

class AppFuncaoSeguranca extends Component {

  constructor(props){
    super(props);
    
    this.state = {
      cookiesdefinidos: false,
      sistemas: [],
      sistemaatual: 0,
      telas: [],
      telaatual: 0,
      funcaoatual: 0,
      funcoestela: [],
      scriptgerado: [],
      scriptmontado: "",
      tipooperacao: "I",
      cmpImput: ["frmCodigoTela", "frmDescricaoTela", "frmDescricaoFuncao", "frmNomeComponente", "App-code", "frmNomeFormulario"],
      painelfechado: true,
      buttonStyle: "danger",
      loading: "blank",
      adicionouTela: false,
      paineltelafechado: true,
      cdfuncaotela: -1,
      confirmado: false
    }

    this.buscarTelas = this.buscarTelas.bind(this);
    this.buscarSistemas = this.buscarSistemas.bind(this);
    this.definirTelaAtual = this.definirTelaAtual.bind(this);
    this.adicionarScript = this.adicionarScript.bind(this);
    this.definirTipoOperacao = this.definirTipoOperacao.bind(this);
    this.limparDados = this.limparDados.bind(this);
    this.adicionarFuncoesTela = this.adicionarFuncoesTela.bind(this);
    this.removerCard = this.removerCard.bind(this);
    this.mostrarMensagem = this.mostrarMensagem.bind(this);
    this.mandarConsole = this.mandarConsole.bind(this);
  }

  componentDidMount() {
    if (cookies.get('ipbase') !== "" && cookies.get('ipbase') !== undefined) {
      this.setState({cookiesdefinidos: true});
    }
    this.definirDadosDaBaseDeDados();
  }
  
  definirDadosDaBaseDeDados(){
    if (cookies.get('ipbase') === undefined) 
      return;
    document.getElementById('frmIPBase').value = cookies.get('ipbase');
    document.getElementById('frmInstanciaBase').value = cookies.get('instancia');
    document.getElementById('frmAliasBase').value = cookies.get('alias');
  }

  definirCookies(){
    if (this.state.cookiesdefinidos)
      return;
    cookies.set('ipbase', document.getElementById('frmIPBase').value, {path: "/"});
    cookies.set('instancia', document.getElementById('frmInstanciaBase').value, {path: "/"});
    cookies.set('alias', document.getElementById('frmAliasBase').value, {path: "/"});
  }

  definirEstadoDaConexao(){
    if (this.state.sistemas.length === 0) 
      return;

    if (this.state.telas.length > 0) 
      return;
    
    this.setState({buttonStyle: "success", painelfechado: false});
  }

  testarDadosParaConexaoValidos(){
    return (document.getElementById('frmIPBase').value !== "" &&
    document.getElementById('frmInstanciaBase').value !== "" &&
    document.getElementById('frmAliasBase').value !== "");
  }

  buscarSistemas(){
    if (!this.testarDadosParaConexaoValidos())
      return;

    this.definirCookies();

    let obj = this;

    function chamar(data){
      obj.setState({sistemas: data});
      obj.definirEstadoDaConexao();
    };

    const paramReq = {
      tabela: "ESEGSISTEMA",
      filtro: undefined,
      ordem: "CDSISTEMA",
      callback: chamar
    };

    paramReq.this = obj;
    
    buscarDados(paramReq);
  }
  
  buscarTelas(event){
    this.setState({
      telas: [],
      telaatual: 0,
      funcoes: [],
      funcaoatual: 0,
      funcoestela: []
    });
    let obj = this;

    this.setState({sistemaatual: event.target.value});

    function chamar(data){
      if (!data) return;
      obj.setState({telas: data, telaatual: data[0].CDTELA, paineltelafechado: false});
    };
    
    const paramReq = {
      tabela: "ESEGTELA",
      filtro: "CDSISTEMA = " + event.target.value,
      ordem: "CDTELA",
      adicionarObjeto: {CDTELA: 0, DETELA: "Tela nova"},
      callback: chamar
    };

    paramReq.this = obj;

    buscarDados(paramReq);
  }

  buscarFuncoesTela(telaatual){
    let obj = this;

    function chamar(data){
      obj.setState({funcoestela: data})
    };

    let filtro = "CDSISTEMA = " + this.state.sistemaatual;
    filtro += " and CDTELA = " + telaatual;

    const paramReq = {
      tabela: "ESEGFUNCAOTELA",
      filtro: filtro,
      ordem: "DEFUNCAO",
      adicionarObjeto: undefined,
      callback: chamar
    };

    paramReq.this = obj;

    buscarDados(paramReq);
  }

  definirTelaAtual(event){
    if (Number(event.target.value) !== 0)
      this.buscarFuncoesTela(event.target.value);

    this.setState({telaatual: event.target.value});

    if (Number(event.target.value) === this.state.telas[0].CDTELA) {
      this.setState({paineltelafechado: false});
      return;
    }
    this.setState({paineltelafechado: true});
  }

  definirTipoOperacao(event){
    this.setState({tipooperacao: event.target.value});
  }

  definirCdFuncaoTela(codigo){
    if (codigo !== -1){
      ++codigo;
      this.setState({cdfuncaotela: codigo});
    }
    return codigo;
  }

  buscarUltimaFuncao(){
    let cdfuncaotela = this.definirCdFuncaoTela(this.state.cdfuncaotela);
    if (cdfuncaotela !== -1){
      return cdfuncaotela;
    }

    let funcoestela = this.state.funcoestela;

    if (funcoestela.length === 0) return;

    function ordenar(prop){
      return function(a,b){
        if (a[prop] > b[prop]) {
          return -1;
        } else if(a[prop] < b[prop]) {
          return 1;
        }
        return 0;
      }
    }

    funcoestela.sort(ordenar("CDFUNCAO"));
    cdfuncaotela = this.definirCdFuncaoTela(funcoestela[0].CDFUNCAO);
    return cdfuncaotela;
  }

  adicionarFuncoesTela() {
    const bUtilizarSenha = document.getElementById('frmUtilizaSenha').checked;
    let sUtilizarSenha = "N";
    if (bUtilizarSenha) {
      sUtilizarSenha = "S";
    }

    let telaAtual = this.state.telaatual;
    if (!this.state.paineltelafechado) {
      telaAtual = document.getElementById("frmCodigoTela").value;
    }

    let script = `
        INSERT INTO esegFuncaoTela 
          (cdSistema, cdTela, cdFuncao, deFuncao, flChecaSenha, tpOperacao, nmComponente)
        VALUES 
          (${this.state.sistemaatual}, ${telaAtual}, ${this.buscarUltimaFuncao()}, '${document.getElementById('frmDescricaoFuncao').value}', '${sUtilizarSenha}', '${this.state.tipooperacao}', '${document.getElementById('frmNomeComponente').value}');
        GO
        `;

    let scriptgerado = this.state.scriptgerado;
    scriptgerado.push(script);
    this.setState({scriptgerado: scriptgerado});
  }

  adicionarTela() {
    if (this.state.adicionouTela || this.state.paineltelafechado)
      return true;

    if (document.getElementById('frmCodigoTela').value === undefined || document.getElementById('frmCodigoTela').value === ""){
      //alert("Não há definição dos dados de tela.")
      return false;
    }

    let bAutorizado = document.getElementById('frmSempreAutorizar').checked;
    let sAutorizado = "N";
    if (bAutorizado) {
      sAutorizado = "S";
    }

    let script = `
        INSERT INTO esegTela 
          (cdSistema, cdTela, deTela, nmForm, flSempreAutorizSPW, flForaUso)
        VALUES 
          (${this.state.sistemaatual}, ${document.getElementById('frmCodigoTela').value}, '${document.getElementById('frmDescricaoTela').value}', '${document.getElementById('frmNomeFormulario').value}', '${sAutorizado}', 'N');
        GO
        `;

    let scriptgerado = this.state.scriptgerado;
    scriptgerado.push(script);
    this.setState({scriptgerado: scriptgerado});
    this.setState({adicionouTela: true});
    return true;
  }

  testarDadosParaFuncaoDeSegurancaValidos(){
    let bDescricaoDaFuncaoValido = document.getElementById('frmDescricaoFuncao').value !== "";
    let bPainelDeTelaAberto = !this.state.paineltelafechado;
    let bCodigoDaTelaValido = document.getElementById('frmCodigoTela').value !== "";
    let bDescricaoTelaValido = document.getElementById('frmDescricaoTela').value !== "";
    let bNomeDoFormularioValido = document.getElementById('frmNomeFormulario').value !== "";
  
    if (!bPainelDeTelaAberto) 
      return bDescricaoDaFuncaoValido;
    
    return bDescricaoDaFuncaoValido && bCodigoDaTelaValido && bDescricaoTelaValido && bNomeDoFormularioValido;       
  }

  adicionarScript(){
    if(!this.testarDadosParaFuncaoDeSegurancaValidos())
      return;

    if (!this.adicionarTela()) 
      return;

    this.adicionarFuncoesTela();
    this.definirDadosDeScript();
  }

  definirDadosDeScript(){
    if (this.state.scriptgerado.length === 0) 
      return;
    let retorno = `
    <DATABASE_MASTER`;

    this.state.scriptgerado.map((item) => retorno += item);
    retorno += `
    DATABASE_MASTER>`;

    this.setState({scriptmontado: retorno});
  }

  confirmar(title, msg, callbackYes, callbackNo){
    confirmAlert({
      title: title,
      message: msg,
      buttons: [
        {
          label: "Sim",
          onClick: callbackYes
        },
        {
          label: "Não",
          onClick: callbackNo
        }
        
      ]
    })
  }

  limparDados(){
    let obj = this;

    function callbackYes(){
      let dados = {
        scriptgerado: [],
        scriptmontado: ""    
      };
  
      obj.setState(dados);
    }

    this.confirmar("Confirmar", "Confirma limpeza de script?", callbackYes);
  }

  removerCard(card){
    let confirmado = window.confirm("Confirma exclusÃ£o do script?");
    
    if (!confirmado) return;

    if (this.state.scriptgerado.length === 0)
      return;
    let items = [];
    items = this.state.scriptgerado;
    items.splice(card, 1);

    this.setState({scriptgerado: items});

    this.definirDadosDeScript();
  }

  mostrarMensagem(msg){
    toast.success(msg, {
      position: toast.POSITION.TOP_CENTER,
      className: 'black-background',
      bodyClassName: "grow-font-size",
      progressClassName: 'fancy-progress-bar' 
    });
  } 

  mandarConsole(item){
    console.log(item);
  }

  render() {
    const submit = (e) => { 
      e.preventDefault();
      e.stopPropagation();
    }

    return (
      <div className="App container">
        <header className="App-header">
          <Col md={6} sm={6} lg={6}>
            <img src={logo} className="App-logo" alt="logo" />
          </Col>
          <Col md={6} sm={6} lg={6}>
            <h1 className="App-title">Gerar script função de segurança - {AppVersao}</h1>
          </Col>
        </header>
        <p className="App-intro">
        </p>

        <ToastContainer></ToastContainer>

        <Panel bsStyle="primary">
          <Panel.Heading>Base de dados</Panel.Heading>
          <Panel.Body>
            <Form inline onSubmit={submit}>
              <Row>
                <Col sm={4} md={4} lg={4}>
                  <ControlLabel>IP</ControlLabel>
                  <FormControl id="frmIPBase" style={{width: '100%'}} type="text" placeholder="192.168.225.175" required></FormControl>
                </Col>  
                <Col sm={3} md={3} lg={3}>
                  <ControlLabel>Instância</ControlLabel>
                  <FormControl id="frmInstanciaBase" style={{width: '100%'}} type="text" placeholder="ISAJ01" required></FormControl>
                </Col>  
                <Col sm={3} md={3} lg={3}>
                  <ControlLabel>Alias</ControlLabel>
                  <FormControl id="frmAliasBase" style={{width: '100%'}} type="text" placeholder="PG5TINT" required></FormControl>
                </Col>  
                <Col sm={1} md={1} lg={1}>
                  <Button id="btnConectar" type="submit" bsStyle={this.state.buttonStyle} style={{'marginTop': '20px'}} onClick={() => this.buscarSistemas()}>Conectar</Button>
                </Col>  
                <Col sm={1} md={1} lg={1}>
                  <ReactLoading className="Loading" type={this.state.loading} color="#0067ac"></ReactLoading>
                </Col>  
              </Row>            
            </Form>
          </Panel.Body>
        </Panel>

        <Panel bsStyle="primary">
          <Panel.Heading>Origem</Panel.Heading>
          <Panel.Body collapsible={this.state.painelfechado}>
            <FormGroup>
              <ControlLabel>Sistemas</ControlLabel>
              <FormControl componentClass="select" placeholder="Selecione a opção" value={this.state.sistemaAtual} onChange={this.buscarTelas}>
                {
                  this.state.sistemas.map((sistema) => (
                    <option key={sistema.CDSISTEMA} value={sistema.CDSISTEMA}>{sistema.CDSISTEMA} - {sistema.NMSISTEMA}</option>
                  )) 
                }          	
              </FormControl>
            </FormGroup>

            <FormGroup>
              <ControlLabel>Telas</ControlLabel>
              <FormControl componentClass="select" placeholder="Selecione a opção" value={this.state.telaatual} onChange={this.definirTelaAtual}>
                {
                  this.state.telas.map((tela) => (
                    <option key={tela.CDTELA} value={tela.CDTELA}>{tela.CDTELA} - {tela.DETELA}</option>
                  )) 
                }          	
              </FormControl>
            </FormGroup>
            </Panel.Body>
          </Panel>

          <Form inline onSubmit={submit}>
            <Panel bsStyle="primary">
              <Panel.Heading>
                Tela
              </Panel.Heading>
              <Panel.Body collapsible={this.state.paineltelafechado}>
                  <Row>
                    <Col sm={4} md={4} lg={2}>
                      <ControlLabel>Código</ControlLabel>
                      <FormControl id="frmCodigoTela" style={{width: '100%'}} type="text" placeholder="Código da tela" required={!this.state.paineltelafechado}></FormControl>
                    </Col>  
                    <Col sm={8} md={8} lg={10}>
                      <ControlLabel>Descrição</ControlLabel>
                      <FormControl id="frmDescricaoTela" style={{width: '100%'}} type="text" placeholder="Descrição da tela" required={!this.state.paineltelafechado}></FormControl>
                    </Col>  
                  </Row>
                  <Row>
                    <Col sm={4} md={4} lg={2}>
                      <Checkbox id="frmSempreAutorizar"> Sempre autorizar SPW </Checkbox>
                    </Col>  
                    <Col sm={8} md={8} lg={10}>
                      <ControlLabel>Nome do formulário</ControlLabel>
                      <FormControl id="frmNomeFormulario" style={{width: '100%'}} type="text" placeholder="Nome do formulário" required={!this.state.paineltelafechado}></FormControl>
                    </Col>  
                  </Row>
              </Panel.Body>
            </Panel>    

            <Panel bsStyle="primary">
              <Panel.Heading>
                Função de segurança
              </Panel.Heading>
              <Panel.Body collapsible={this.state.painelfechado}>
                  <Row>
                    <Col sm={3} md={3} lg={3}>
                      <ControlLabel>Operação</ControlLabel>
                      <FormControl id="frmTipoOperacao" style={{width: '100%'}} value={this.state.tipooperacao} componentClass="select" onLoad={this.definirTipoOperacao} onChange={this.definirTipoOperacao}>
                        <option key="I" value="I">Inclusão</option>
                        <option key="A" value="A">Alteração</option>
                        <option key="E" value="E">Exclusão</option>
                        <option key="C" value="C">Acesso</option>
                        <option key="O" value="O">Outros</option>
                      </FormControl>
                    </Col>  
                    <Col sm={3} md={3} lg={9}>
                      <ControlLabel>Descrição da função</ControlLabel>
                      <FormControl id="frmDescricaoFuncao" style={{width: '100%'}} type="text" placeholder="Descrição da função" required></FormControl>
                    </Col>
                  </Row>
                  <Row>
                    <Col sm={3} md={3} lg={3}>
                      <Checkbox id="frmUtilizaSenha" style={{'textAlign': 'center'}}> Utiliza senha </Checkbox>
                    </Col>  
                    <Col sm={3} md={3} lg={9}>
                      <ControlLabel>Nome do componente</ControlLabel>
                      <FormControl id="frmNomeComponente" style={{width: '100%'}} type="text" placeholder="Nome do componente"></FormControl>
                    </Col>
                  </Row>
              </Panel.Body>
              <Panel.Footer>
                <Button type="submit" bsStyle="primary" onClick={this.adicionarScript}>Adicionar</Button>
              </Panel.Footer>
            </Panel>
          </Form>
          <Panel bsStyle="primary">
              <Panel.Heading style={{height: '55px', 'fontSize': '1.5em'}}>
                Script - <strong>SQL Server</strong>
                <ButtonGroup className="pull-right">
                  <Button bsStyle="primary" onClick={this.limparDados}>Limpar</Button>
                  <CopyToClipboard text={this.state.scriptmontado}>
                    <Button bsStyle="primary" onClick={() => this.mostrarMensagem("Script gerado e enviado para área de transferência!", "Mensagem")}>Gerar script e copiar</Button>
                  </CopyToClipboard>
                </ButtonGroup>
              </Panel.Heading>
              <Panel.Body collapsible={this.state.painelfechado}>
                {
                  this.state.scriptgerado.map((item, k) => (
                    <BaseCard key={k}>
                      <div className="App-code" style={{'background': '#0067ac'}}>
                        <Row>
                          <Col sm={11} md={11} lg={11}>
                            <strong><FormControl id="App-code" componentClass="textarea" value={item} style={{'height': '158px'}} /></strong>
                          </Col>
                          <Col sm={1} md={1} lg={1}>
                            <Button onClick={() => this.removerCard(k)}>
                                <Glyphicon glyph="remove"/>
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    </BaseCard> 
                  ))
                }
              </Panel.Body>
          </Panel>
      </div>
    );
  }
}

export default AppFuncaoSeguranca;


