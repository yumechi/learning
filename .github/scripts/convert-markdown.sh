for file in `ls ./src/*.md`
do
  echo "Converting $file to ${file%.md}.re"
  md2review "$file" > "${file%.md}.re"
done
