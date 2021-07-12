# DevCoach API

> This is Simple Queuing System develop for WonderQ.

## Install Dependencies

```
npm install
```

## Run App

```
# Run in dev mode
npm run dev

```

## API Documentation

```
You can see a detail documentation of this api by visiting
https://documenter.getpostman.com/view/5994319/Tzm8EvGa

You can also visit the root of the application (http://localhost:5000/) and you will find the API documentation as well.

```

## Architecture

```
This service has 3 moving parts, the producer, the consumer and the queue
1. Producer
	- the producer will be able send messages to the queue using the Add a Message to the queue endpoint
2. Consumer
	- The consumer will be able to request a batch of messages to be process using the Get a batch of messages endpoint.
	- The consumer will need to process the messages and send a delete message request to the client using the Delete message endpoint per message on the allow time (default time is 40 seconds)
	- If the consumer does not process all the messages on the allow time the remaining messages will be put back to the queue so other consumer could process them.
	- Multiple consumer can get access to different messages but they will not have access the the same messages
3. Queue
	- The queue will do it's best to send the messages in the other that they were receive but it's not guaranty
	- When a consumer request a batch of messages those message are place on a processing queue so no other consumer could access then.
	- If the allow time for a consumer to process the messages has pass all the messages remaining on the processing queue wil be put back to the queue so other consumer can access them
	- The amount of time and the amount of messages return to consumer are configurable by the Change queue configuration endpoint.
```

- Version: 1.0.0
- License: MIT
