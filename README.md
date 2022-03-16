# smtp-gmail-api-bridge
Bridge between SMTP and Gmail. SMTP server using the gmail API to send emails.

## Installation
1. Clone this repository
2. yarn
3. yarn start

## Creating users
1. cd src
2. node cli add-user --login "wannes" --password "wannes" --ip "0.0.0.0/0"

## API Usage
```{
    "password": "wannes",
    "user": "wannesmatthys",
    "subject": "hi",
    "body": "<h1>hello world</h1>",
    "to": [
        "wannesmatthys@gmail.com",
        "wannes233@gmail.com"
    ]
}```