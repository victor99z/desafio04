module.exports = async function (context, req) {
    const registros = req.body.payloadInput.registros

    context.res = {
        body: registros
    }

}