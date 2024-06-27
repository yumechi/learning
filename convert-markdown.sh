for file in `ls ./src/*.md`
do
  echo "Converting $file to ${file%.md}.re"
  cat "$file" > "${file%.md}.re"
done
