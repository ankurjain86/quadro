const AWS = require('aws-sdk')
const container = Q.container

function createSDK(config) {
  // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    let profile = process.env.AWS_PROFILE || config.get('quadro.aws.profile', 'default')
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile })
  }

  // https://aws.amazon.com/blogs/developer/support-for-promises-in-the-sdk/
  AWS.config.setPromisesDependency(Promise)

  // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html
  let region = process.env.AWS_REGION || config.get('quadro.aws.region')
  AWS.config.update({ region })
  return AWS
}

function registerDynamoDB() {
  Q.container.registerSingleton('dynamodb', async function(aws) {
    let options = {}
    let { port, local } = Q.config.get('quadro.aws.dynamodb', {})
    if (local) {
      require('local-dynamo').launch(null, port)
      options.endpoint = `http://localhost:${port}`
    }

    return new aws.DynamoDB(options)
  })
}

// Expose an SDK factory for testing
if (Q.app.env === 'test') {
  container.register('aws-factory', createSDK)
}

registerDynamoDB()

module.exports = createSDK
