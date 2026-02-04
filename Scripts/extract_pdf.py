
import sys
from pypdf import PdfReader

def extract_text(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    pdf_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Plan Opérationnel 2026 IFA - Annual Report (1920 x 1080 px)_compressed.pdf"
    print(extract_text(pdf_path))
