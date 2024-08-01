# RelayBox REST SDK

Find the full technical [documention here](https://relaybox.net/docs)

Welcome to RelayBox.

In order to use this library, you need to create a free account and [API key](https://relaybox.net/docs/authentication/api-keys). Find more details [here](https://relaybox.net/docs/getting-started).

# @relaybox/rest

The purpose of this library is to enable seamless integration between your server-side applications and RelayBox's REST services.

## Installation

To install the REST services library, ensure that npm is installed on the host machine, then run the following command:

```
npm install @relaybox/rest
```

Once you have successfully installed the library, the following API reference applies.

## RelayBox Class

Instantiate the Relaybox class to enable usage of the server-side SDK.

```typescript
const relayBox = new RelayBox();

class RelayBox {
  constructor(opts: RelayBoxOptions);
  generateTokenResponse(params: TokenResponseParams): TokenResponse;
  publish(roomId: string | string[], event: string, data: any): Promise<PublishResponseData>;
}
```

## RelayBoxOptions

RelayBox class constructor options:

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

const allowedPermissions: readonly ['subscribe', 'publish', 'presence', 'metrics', '*'];

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
        Associate an API key with the connection, which you can generate via the
        <Link href="/dashboard">dashboard</Link>. To create an API key, first
        <Link href="/auth/login?authStage=register">register for a free account</Link>.
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
    'metrics'
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
