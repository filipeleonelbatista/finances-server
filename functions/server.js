const fs = require('fs');
const express = require('express');
const cors = require('cors');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const multer = require('multer');
const csv = require('csv-parser');

const app = express();

// Middleware para habilitar o CORS
app.use(cors());
app.use(express.json());

app.use(express.static('./static'));

const upload = multer({ dest: './uploads/' });

app.get('/', (req, res) => res.json({ message: "OK" }))

app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
  }

  const results = [];

  // Faz o parse do arquivo CSV e preenche o array de resultados
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Remove o arquivo CSV após o processamento
      fs.unlinkSync(req.file.path);

      // Retorna o objeto "financas"
      res.json({ financas: results });
    });
});

app.post('/financas', (req, res) => {
  const { financas } = req.body;
  console.log(financas)
  if (!financas || !Array.isArray(financas)) {
    return res.status(400).json({ error: 'O corpo da solicitação deve conter os dados da lista de financas.' });
  }

  // Define as colunas do arquivo CSV
  const filePath = './static/financas' + Date.now() + '.csv'
  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      { id: 'amount', title: 'amount' },
      { id: 'date', title: 'date' },
      { id: 'paymentDate', title: 'paymentDate' },
      { id: 'description', title: 'description' },
      { id: 'category', title: 'category' },
      { id: 'paymentStatus', title: 'paymentStatus' },
      { id: 'isEnabled', title: 'isEnabled' },
      { id: 'isFavorited', title: 'isFavorited' },
    ],
  });

  // Escreve os dados do array de produtos no arquivo CSV
  csvWriter
    .writeRecords(financas)
    .then(() => {
      console.log('O arquivo CSV foi gerado com sucesso.');
      res.download(filePath);
    })
    .catch((error) => {
      console.error('Ocorreu um erro ao gerar o arquivo CSV:', error);
      res.status(500).json({ error: 'Ocorreu um erro ao gerar o arquivo CSV.' });
    });
});

app.listen(process.env.PORT ?? 3000, () => {
  console.log(`A API está rodando em http://localhost:${process.env.PORT ?? 3000}`);
});
