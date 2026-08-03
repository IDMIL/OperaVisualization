import deepl
import json
import time

def _write_with_retry(path, data, attempts=30, delay=0.5):
    last_error = None
    for _ in range(attempts):
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            return
        except OSError as e:
            last_error = e
            time.sleep(delay)
    raise last_error

def translate(text, source_language, target_language):
    with open('translations/translations.json', 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    if text not in json_data:
        json_data[text] = {source_language: text}
    if target_language not in json_data[text]:
        auth_key = ""
        deepl_client = deepl.DeepLClient(auth_key)
        print("Calling API to translate ", text, " to ", target_language)
        result = deepl_client.translate_text(text, source_lang=source_language, target_lang=target_language)
        json_data[text][target_language] = result.text
    _write_with_retry('translations/translations.json', json_data)
    return json_data[text][target_language]

if __name__ == '__main__':
    translate('Spatialisation malhérienne ', 'FR', 'EN-US')