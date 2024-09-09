import { connectDB } from '@/utils/db';
import { PythonShell } from 'python-shell';
import path from 'path';

// 텍스트 전처리 함수
function preprocessText(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// 코사인 유사도 계산 함수
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

// 문장 임베딩을 계산하는 함수
function getEmbedding(text) {
    return new Promise((resolve, reject) => {
        const options = {
            mode: 'text',
            pythonOptions: ['-u'],
            scriptPath: path.join('C:\Users\STW\Desktop\Test\nextjs\src\python'),
            args: [text],
            pythonPath: 'C:\Users\STW\Desktop\Test\nextjs\env\Scripts\python.exe'  // Python 실행 파일 경로 지정
        };
        PythonShell.run('embedding.py', options, (err, results) => {
            if (err) return reject(err);
            const embedding = JSON.parse(results[0]);
            resolve(embedding);
        });
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { query, quantity } = req.body;

    if (!query || !quantity) {
        return res.status(400).json({ message: 'Query and quantity are required' });
    }

    try {
        const client = await connectDB;
        const db = client.db('test');

        // master 컬렉션에서 데이터 가져오기
        const masterCollection = db.collection('master');
        const masterResult = await masterCollection.find().toArray();

        // test 컬렉션에서 데이터 가져오기
        const testCollection = db.collection('test');
        const testResult = await testCollection.find().toArray();

        // Query의 임베딩 벡터 계산
        const queryEmbedding = await getEmbedding(preprocessText(query.toString()));

        // master 컬렉션의 제품명 추출 및 임베딩 계산
        const masterProductNames = masterResult
            .map(item => item.제품명 ? preprocessText(item.제품명) : '')
            .filter(name => name);

        const masterEmbeddings = await Promise.all(masterProductNames.map(name => getEmbedding(name)));
        const cosineSim = masterEmbeddings.map(masterEmbedding => cosineSimilarity(queryEmbedding, masterEmbedding));

        const mostSimilarIndex = cosineSim.indexOf(Math.max(...cosineSim));
        const mostSimilarProductName = masterProductNames[mostSimilarIndex];
        const mostSimilarMasterProduct = masterResult[mostSimilarIndex]; // 매칭된 마스터 제품

        // 검색어와 직접 문자열 비교를 통한 매칭
        let exactMatch = null;
        for (let product of masterResult) {
            if (product.제품명 && product.제품명.includes(query)) {
                exactMatch = product;
                break;
            }
        }

        // 콘솔에 매칭된 마스터 제품 출력
        console.log('검색어:', query);
        console.log('매칭된 마스터 제품:', exactMatch || mostSimilarMasterProduct);

        // test 컬렉션에서 유사한 제품명 찾기
        const testProductNames = testResult
            .map(item => item.품명1 ? preprocessText(item.품명1) : '')
            .filter(name => name);

        const testQueryEmbedding = await getEmbedding(mostSimilarProductName.toString());

        const testEmbeddings = await Promise.all(testProductNames.map(name => getEmbedding(name)));
        const testCosineSim = testEmbeddings.map(testEmbedding => cosineSimilarity(testQueryEmbedding, testEmbedding));

        const mostSimilarIndexTest = testCosineSim.indexOf(Math.max(...testCosineSim));
        const mostSimilarInprintPaperProduct = testResult[mostSimilarIndexTest];

        // 콘솔에 매칭된 테스트 제품 출력
        console.log('매칭된 테스트 제품:', mostSimilarInprintPaperProduct);

        // 탄소 배출량 추출
        const carbonEmission = mostSimilarInprintPaperProduct ? mostSimilarInprintPaperProduct.탄소배출량 : null;

        if (carbonEmission === null || carbonEmission === undefined) {
            return res.status(404).json({ message: 'No matching results found' });
        }

        const { 품명1: bestMatchName, 기술범위, 유효시작, 유효종료, 유효지역 } = mostSimilarInprintPaperProduct;

        // 탄소배출량 계산
        const total탄소배출량 = carbonEmission * quantity;

        // 결과 반환
        res.status(200).json({
            검색어: query,
            매칭된마스터제품: exactMatch || mostSimilarMasterProduct,
            매칭된제품명: bestMatchName,
            탄소배출량: total탄소배출량,
            기술범위,
            유효시작: 유효시작 || 'NA',
            유효종료: 유효종료 || 'NA',
            유효지역
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
