import deepl
import json

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
    with open('translations/translations.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=4)
    return json_data[text][target_language]

if __name__ == '__main__':
    translate('Spatialisation malhérienne ', 'FR', 'EN-US')