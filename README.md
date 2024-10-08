![npm version](https://img.shields.io/npm/v/@relaybox/rest)

# @relaybox/rest

Find the full technical [documention here](https://relaybox.net/docs/api-reference/relaybox-rest)

Welcome to RelayBox, we're exited you're here!

First up, in order to use this library, you'll need to create a free account and [API key](https://relaybox.net/docs/authentication/api-keys). Find more details [here](https://relaybox.net/docs/getting-started).

If you find any issues, please report them [here](https://github.com/relaybox/relaybox-rest-js/issues) or contact support@relaybox.net.

## Installation

To install the REST services library, ensure you have npm running on your machine, then run the following command:

```
npm install @relaybox/rest
```

Once you've successfully installed the library, see below for the API reference in more detail or find the full documenation [here](https://relaybox.net/docs/api-reference/relaybox-rest).

## RelayBox Constructor

To begin interactaction with the REST services, instantiate a new RelayBox object.

```typescript
const relayBox = new RelayBox();

class RelayBox {
  constructor(opts: RelayBoxOptions);
  generateTokenResponse(params: TokenResponseParams): TokenResponse;
  publish(roomId: string | string[], event: string, data: any): Promise<PublishResponseData>;
}
```

## RelayBoxOptions

The various configuration options you'll find throughout the library.

```typescript
interface RelayBoxOptions {
  apiKey?: string;
}

interface TokenResponseParams {
  clientId?: string | string[];
  expiresIn?: number;
  permissions?: Permission[] | Permissions;
}

interface TokenResponse {
  token: string;
  expiresIn: number;
}

const allowedPermissions: readonly ['subscribe', 'publish', 'presence', 'metrics', 'history', '*'];

type Permission = (typeof allowedPermissions)[number];

interface Permissions {
  [room: string]: string[];
}
```

<table>
  <thead>
    <tr>
      <th>Configuration Option</th>
      <th>Description</th>
      <th>Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        apiKey <br />
        (required)
      </td>
      <td>
        An API key plays an important role in identitfying your app when publising events or conneciing to the realtime services. Head over to the
        <Link href="/dashboard">dashboard</Link> to <Link href="/auth/login?authStage=register">register for a free account</Link> and create an API key if you havn't already. 
      </td>
      <td>string</td>
    </tr>
  </tbody>
</table>

## generateTokenResponse()

Responsible for generating a secure token to be sent as an HTTP response, which can be exchanged for access to real-time services via <Link href="/docs/api-reference/relaybox-client">@relaybox/client</Link>. To learn more about auth tokens, please refer to the <Link href="/docs/authentication/auth-tokens">Auth Tokens</Link> documentation.

```typescript
relayBox.generateTokenResponse();
```

Returns string in <a href="https://jwt.io" target="blank">JWT</a> format

<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        clientId <br />
        (optional)
      </td>
      <td>
        Include a clientId to associate an identity with the token. You must provide a clientId for
        a connection using the generated token to participate in a room's presence set.
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td>
        expiresIn <br />
        (optional)
      </td>
      <td>
        The length of time specified in seconds before the generated token expires and can no longer
        be used to connect to real-time services
      </td>
      <td>900</td>
    </tr>
    <tr>
      <td>
        permissions <br />
        (optional)
      </td>
      <td>
        Optional dynamic permissions overrides specific to the token being generated. To learn more
        about permissions please see
        <Link href="http://localhost:3000/docs/rooms/access-controls#dynamic-permissions">
          Dynamic Permissions
        </Link>
      </td>
      <td>["*"]</td>
    </tr>
  </tbody>
</table>

Example:

```typescript
// Generate a token response with a clientId and custom expiry
const tokenResponse = relayBox.generateTokenResponse({
  clientId: 123,
  expiresIn: 300
});

// Generate a token response attaching dynamic permissions
const permissions = {
  myRoom: [
    'subscribe',
    'publish',
    'presence',
    'metrics',
    'history'
  ];
};

const tokenResponse = relayBox.generateTokenResponse({
  permissions
});
```

## publish()

Responsible for publishing an event to a named "room".

```typescript
relayBox.publish();
```

Returns object of type PublishResponseData

```typescript
interface PublishResponseData {
  timestamp: string;
  signature: string;
}
```

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Description</th>
      <th>Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>**Room Name (required):** The name of the room to publish the event to</td>
      <td>string</td>
    </tr>
    <tr>
      <td>2</td>
      <td>
        **Event Name (required):** The name of the published event. Connections subscribing to this
        event by name will receive the event.
      </td>
      <td>string / function</td>
    </tr>
    <tr>
      <td>2</td>
      <td>**Data (optional):** The data to be sent as the event payload</td>
      <td>string / object</td>
    </tr>
  </tbody>
</table>

Example:

```typescript
const data = {
  hello: 'world'
};

// Publish an event named 'message' to 'room:one' containing data payload
const response = relayBox.publish('room:one', 'message', data);
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
