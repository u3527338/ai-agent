import speech_recognition as sr
import requests
import time

# 這是你 Next.js API 的地址
# 確保你 npm run dev 跑在 3000 端口
API_URL = "http://localhost:3000/api/speech"

def listen_loop():
    recognizer = sr.Recognizer()
    # 設置環境噪音自動調整，這樣比較不會誤觸
    recognizer.energy_threshold = 300 
    recognizer.dynamic_energy_threshold = True

    try:
        mic = sr.Microphone()
    except Exception as e:
        print(f"❌ 找不到麥克風: {e}")
        return

    with mic as source:
        print("\n" + "="*30)
        print("🟢 LUMOS 監聽中 (Python Bridge)")
        print("可以直接說話，我會把文字傳給 Next.js")
        print("="*30 + "\n")
        
        # 調整環境音
        recognizer.adjust_for_ambient_noise(source, duration=1)

        while True:
            try:
                print("👂 正在聽...")
                # phrase_time_limit 限制每一句最長 10 秒
                audio = recognizer.listen(source, timeout=None, phrase_time_limit=10)
                
                print("📝 正在轉譯...")
                # 使用 Google 免費接口
                text = recognizer.recognize_google(audio, language="zh-HK")
                
                if text:
                    print(f"✅ 識別成功: {text}")
                    # 傳送到 Next.js API
                    try:
                        response = requests.post(API_URL, json={"text": text}, timeout=2)
                        if response.status_code == 200:
                            print("🚀 已成功傳送到 Next.js")
                        else:
                            print(f"⚠️ Next.js API 報錯: {response.status_code}")
                    except requests.exceptions.ConnectionError:
                        print("❌ 無法連接到 Next.js (請確保 npm run dev 已啟動)")
                
            except sr.UnknownValueError:
                # 這是指「有聲音但聽不懂在說什麼」，通常跳過即可
                print("❓ 聽不清楚，請再說一次...")
            except sr.RequestError as e:
                print(f"❌ 無法連接到語音服務: {e}")
            except Exception as e:
                print(f"💥 發生錯誤: {e}")
                time.sleep(1)

if __name__ == "__main__":
    listen_loop()