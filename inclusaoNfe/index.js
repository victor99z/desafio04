const axios = require("axios")
const moment = require("moment")

let violations = []
let chaves = []

const url_api = "http://worldclockapi.com/api/json/est/now"

const valida_unidade = (unidade) => {
    if (unidade == null || unidade === '' || typeof (unidade) !== 'string') {
        violations.push("IdUnidadeSaaS não encontrada")
    }
}

const valida_chaveNfe = (chavenfe) => {
    if (chavenfe == null || chavenfe === '' || typeof (chavenfe) !== 'string') {
        violations.push("ChaveNfe não informada")
    }
}

const verifica_duplicatas_nfe = (chaveNfe) => {
    if (chaves.find(item => item.payloadInput.chaveDocumento.chaveNfe == chaveNfe)) {
        violations.push("chaveNfe duplicada")
    }
}

const verifica_codigo_filial = (cod1, cod2) => {
    if (!(cod1 == cod2)) {
        violations.push("Codigo filial diferente do registro anterior");
    }
}

const verifica_nfe = (nfe1, nfe2) => {
    if (!(nfe1 == nfe2)) {
        violations.push("ChaveNfe diferente do registro anterior")
    }
}

// TODO: implementar a questão de não poder inserir fornecedores proibidos.

module.exports = async function (context, req) {
    const data = req.body;
    const unidade_saas = data.payloadInput.chaveDocumento.idUnidadeSaas
    const chaveNfe = data.payloadInput.chaveDocumento.chaveNfe
    const tipo = data.payloadInput.tipo
    const codigoFilial = data.payloadInput.chaveDocumento.codigoFilial
    violations = []

    valida_unidade(unidade_saas)
    valida_chaveNfe(chaveNfe)

    if (tipo.acao == 'ATUALIZACAO') {
        chaves.map((item, index) => {
            if (item.payloadInput.chaveDocumento.chaveNfe == chaveNfe) {

                verifica_codigo_filial(item.payloadInput.chaveDocumento.codigoFilial, codigoFilial)
                verifica_nfe(item.payloadInput.chaveDocumento.chaveNfe, chaveNfe)

                const data_atual = new moment()
                const data_antiga = new moment(item.payloadOutput.dateTime)
                const diff = moment.duration(data_atual.diff(data_antiga))
                const minutos = diff.asMinutes()

                if (minutos >= 3 && violations <= 0) {

                    chaves[index] = {
                        payloadInput: data.payloadInput,
                        payloadOutput: {
                            documento: data.payloadInput.chaveDocumento,
                            dateTime: data_atual
                        },
                        violations
                    }

                    context.res = {
                        body: {
                            payloadInput: data.payloadInput,
                            payloadOutput: {
                                documento: data.payloadInput.chaveDocumento,
                                dateTime: data_atual
                            },
                            violations
                        }
                    }
                    return
                } else if (minutos < 3) {
                    violations.push("Não foi possivel atualizar. Tempo de atualização menor que 3 minutos")
                }
            }
        })

        if (chaves.length <= 0) {
            violations.push("Não há registros para atualizar")
        }

        context.res = {
            body: {
                payloadInput: data.payloadInput,
                payloadOutput: {},
                violations
            }
        }
        return
    } else if (tipo.acao == 'INCLUSAO') {
        verifica_duplicatas_nfe(chaveNfe)
        if (violations.length > 0) {
            context.res = {
                body: {
                    payloadInput: data.payloadInput,
                    payloadOutput: {},
                    violations
                }
            }
            return
        }
        const respose_date = await axios.get(url_api)

        const body_response = {
            payloadInput: data.payloadInput,
            payloadOutput: {
                documento: data.payloadInput.chaveDocumento,
                dateTime: respose_date.data.currentDateTime
            },
            violations: []
        }

        chaves.push(body_response)

        context.res = {
            body: body_response
        }
    } else {
        context.res = {
            body: {
                payloadInput: data.payloadInput,
                payloadOutput: {},
                violations
            }
        }
    }

}