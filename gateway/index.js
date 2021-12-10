const axios = require("axios")

module.exports = async function (context, req) {

    const tipo = req.body.payloadInput.tipo
    const resposta = {}
    const url_inclusaonfe = "http://localhost:7071/api/inclusaoNfe"
    const url_fornecedores_proibidos = "http://localhost:7071/api/fornecedoresProibidos"

    if (tipo.acao == 'FORNECEDORES_PROIBIDOS') {
        const { data } = await axios.post(
            url_fornecedores_proibidos,
            req.body
        )
        resposta.data = data
    } else {
        const { data } = await axios.post(
            url_inclusaonfe,
            req.body
        )
        resposta.data = data
    }

    context.res = {
        body: resposta.data
    }

}