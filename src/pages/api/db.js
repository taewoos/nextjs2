import { connectDB } from "@/utils/db";
import stringSimilarity from 'string-similarity';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { query, quantity } = req.body;

    if (!query || !quantity) {
        return res.status(400).json({ message: 'Query and quantity are required' });
    }

    try {
        const db = (await connectDB).db('test'); // DB 접속
        let result = await db.collection('test').find().toArray(); // 모든 데이터 가져오기

        // 유사도 계산
        const matches = result.map(item => {
            // 각 품명 필드가 존재하는지 확인하고 유사도 계산
            const similarities = [
                item.품명1 != null ? stringSimilarity.compareTwoStrings(query, item.품명1) : 0,
                item.품명2 != null ? stringSimilarity.compareTwoStrings(query, item.품명2) : 0,
                item.품명3 != null ? stringSimilarity.compareTwoStrings(query, item.품명3) : 0,
                item.품명4 != null ? stringSimilarity.compareTwoStrings(query, item.품명4) : 0,
                item.품명5 != null ? stringSimilarity.compareTwoStrings(query, item.품명5) : 0,
                item.품명6 != null ? stringSimilarity.compareTwoStrings(query, item.품명6) : 0,
                item.품명7 != null ? stringSimilarity.compareTwoStrings(query, item.품명7) : 0,
                item.품명8 != null ? stringSimilarity.compareTwoStrings(query, item.품명8) : 0,
                item.품명9 != null ? stringSimilarity.compareTwoStrings(query, item.품명9) : 0,
                item.품명10 != null ? stringSimilarity.compareTwoStrings(query, item.품명10) : 0
            ];

            // 가장 높은 유사도를 가진 명칭과 해당 유사도
            const maxSimilarity = Math.max(...similarities);
            const bestMatchName = similarities.indexOf(maxSimilarity) >= 0 
                                  ? item[`품명${similarities.indexOf(maxSimilarity) + 1}`]
                                  : null;

            return {
                ...item,
                similarity: maxSimilarity,
                bestMatchName: bestMatchName,
                bestMatchIndex: similarities.indexOf(maxSimilarity) + 1 // 매칭된 품명의 인덱스 저장
            };
        });

        // 유사도가 10% 이상인 항목들 중에서 가장 높은 유사도를 가진 항목 찾기
        const bestMatch = matches.filter(item => item.similarity >= 0.1)
                                  .sort((a, b) => b.similarity - a.similarity)[0];

        if (!bestMatch) {
            return res.status(404).json({ message: 'No matching results found' });
        }

        // 품명1로 답변하도록 수정
        const { 품명1, 탄소배출량, 기술범위, 유효시작, 유효종료, 유효지역 } = bestMatch;
        const total탄소배출량 = 탄소배출량 * quantity;

        res.status(200).json({
            명칭: 품명1 || 'NA',
            탄소배출량: total탄소배출량 || 'NA',
            기술범위: 기술범위 || 'NA',
            유효시작: 유효시작 || 'NA',
            유효종료: 유효종료 || 'NA',
            유효지역: 유효지역 || 'NA'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
