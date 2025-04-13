import http.client

conn = http.client.HTTPSConnection("connect.dev.instacart.tools")

payload = "{\n  \"title\": \"PUBLIX\",\n  \"line_items\": [\n    {\n      \"name\": \"bread\",\n      \"filters\": {\n        \"brand_filters\": [\n          \"PUBLIX\"\n        ]\n  } \n }]}"

headers = {
    'Accept': "application/json",
    'Content-Type': "application/json",
    'Authorization': "Bearer <KEY>"
    }

conn.request("POST", "/idp/v1/products/products_link?postal_code=32601", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))