 docker build -t powersvr:5000/cryptobets-ethereum -f Ethereum.Dockerfile .
 docker push powersvr:5000/cryptobets-ethereum
 docker build -t powersvr:5000/cryptobets-matic -f Matic.Dockerfile .
 docker push powersvr:5000/cryptobets-matic