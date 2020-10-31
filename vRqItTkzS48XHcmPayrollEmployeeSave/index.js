
/**
 * Nome da primitiva : employeeSave
 * Nome do dominio : hcm
 * Nome do serviço : payroll
 * Nome do tenant : trn73393327
 **/

const axios = require('axios');

exports.handler = async event => {

    let body = parseBody(event);
    let tokenSeniorX = event.headers['X-Senior-Token'];

    // URL base para chamadas e header com token para passar na chamada
    const instance = axios.create({
        baseURL: 'https://platform-homologx.senior.com.br/t/senior.com.br/bridge/1.0/rest/',
        headers: {
          'Authorization': tokenSeniorX
        }
    });

  
   // Id do colaborador
  let employeeId = body.sheetInitial.employee.tableId;
  let admissao = true;
  let employeeName = '';
  
  // Busca informação do colaborador
  let response = await instance.get(`/hcm/payroll/entities/employee/${employeeId}`);
  if(response){
  employeeName = response.data.person.firstname;
  employeeName += ' ' + response.data.person.middlename;
  employeeName += ' ' + response.data.person.lastname;
  admissao = false;
  }
  
  // Valida alteração de nome do colaborador
  if(employeeName != body.sheetInitial.employee.name && admissao == false){
    return sendRes(400, 'O nome do colaborador não pode ser alterado.');
  }

  // Valida matricula do colaborador
  if(body.sheetContract.registernumber == null){
    return sendRes(400, 'A matricula do colaborador deve ser preenchida.');
  }
  
  // Valida campo indicativo de admissão
  if(body.sheetContract.admissionOriginType.value != "Normal"){
    return sendRes(400, 'Não é permitido tipo de admissão diferente de Normal.');
  }
  
  // Valida tipo de escala na admissão
  if(body.sheetInitial.contractType.key == 'Employee' && admissao){ 
  
  // Busca informação da escala
  let escalaId = body.sheetWorkSchedule.workshift.tableId;
  let responseWorkshift = await instance.get(`/hcm/payroll/entities/workshift/${escalaId}`);
    if(responseWorkshift.data.code > 1 &&  responseWorkshift.data.code < 10){
      return sendRes(400, 'Para tipo de colaborador empregado, é permitido apenas escalas de 1 a 10.');  
    }
    if(responseWorkshift.data.workshiftType != 'Permanent'){
      return sendRes(400, 'Para tipo de colaborador empregado, a escala deve ser do tipo permanente.');  
    }
  }
  
 return sendRes(200,body);
};

// Converte body para json quando for string
const parseBody = (event) => {
    return typeof event.body === 'string' ?  JSON.parse(event.body) : event.body || {};
};

// Retorna 
const sendRes = (status, body) => {
    var response = {
      statusCode: status,
      headers: {
        "Content-Type": "application/json"
      },
      body: typeof body === 'string' ? body : JSON.stringify(body) 
    };
    return response;
};