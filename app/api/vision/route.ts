import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const systemInstruction =
  "Bạn là một hướng dẫn viên game. Hãy nhận diện vật thể trong ảnh này và trả về ĐÚNG định dạng JSON chứa các trường: 'name' (Tên vật thể), 'quiz' (1 câu hỏi trắc nghiệm thú vị có 4 đáp án A B C D), 'answer' (Đáp án đúng), 'story' (Một câu chuyện kể bí ẩn, ngắn gọn về vật thể đó). " +
  "Viết bằng tiếng Việt. quiz là chuỗi chứa câu hỏi và đủ 4 lựa chọn A, B, C, D; answer chỉ là một chữ cái A, B, C hoặc D. Chỉ trả về JSON, không dùng Markdown.";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("base64" in body) ||
      typeof body.base64 !== "string" ||
      !body.base64.trim()
    ) {
      return NextResponse.json(
        { error: "Vui lòng gửi ảnh trong trường base64." },
        { status: 400 },
      );
    }

    const { base64 } = body;
    const image = base64.trim();
    const dataUrl = image.match(/^data:(image\/(?:jpeg|png));base64,([\s\S]+)$/);

    if (image.startsWith("data:") && !dataUrl) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ ảnh JPEG hoặc PNG." },
        { status: 400 },
      );
    }

    // inlineData requires the base64 payload without the Data URL prefix.
    const data = (dataUrl ? dataUrl[2] : image).replace(/\s/g, "");
    const mimeType = dataUrl?.[1] ?? (data.startsWith("iVBORw0KGgo") ? "image/png" : "image/jpeg");

    if (!data || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) {
      return NextResponse.json(
        { error: "Dữ liệu base64 không hợp lệ." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Chưa cấu hình GEMINI_API_KEY.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-4-argon",
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            quiz: {
              type: SchemaType.STRING,
              description: "Câu hỏi trắc nghiệm kèm đủ 4 lựa chọn A, B, C, D.",
            },
            answer: { type: SchemaType.STRING, format: "enum", enum: ["A", "B", "C", "D"] },
            story: { type: SchemaType.STRING },
          },
          required: ["name", "quiz", "answer", "story"],
        },
      },
    });

    const result = await model.generateContent([
      { text: "Hãy nhận diện vật thể trong ảnh và tạo nội dung trò chơi theo hướng dẫn." },
      { inlineData: { data, mimeType } },
    ]);
    const content: unknown = JSON.parse(result.response.text());

    if (
      typeof content !== "object" ||
      content === null ||
      !["name", "quiz", "answer", "story"].every(
        (key) => key in content && typeof (content as Record<string, unknown>)[key] === "string",
      ) ||
      !("answer" in content) ||
      !["A", "B", "C", "D"].includes(String(content.answer))
    ) {
      throw new Error("Gemini trả về dữ liệu không đúng cấu trúc.");
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Lỗi xử lý API vision:", error);
    return NextResponse.json(
      { error: "Không thể nhận diện vật thể. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
